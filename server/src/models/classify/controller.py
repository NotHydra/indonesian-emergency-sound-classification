import datetime
import json
import os
import tempfile
from io import BytesIO

import keras
import librosa
import numpy as np
from fastapi import APIRouter, File, UploadFile, Request
from pydub import AudioSegment

from common.enums.response import ResponseStatusEnum
from config import limiter
from utilities.logger import Logger
from utilities.response import Response

loaded_model = keras.models.load_model("model.h5")

# Configuration
MAX_FILE_SIZE_MB = 10
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
ALLOWED_EXTENSIONS = {".wav", ".mp3", ".webm", ".ogg", ".m4a", ".oga"}
ALLOWED_MIME_TYPES = {
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/mpeg",
    "audio/mp3",
    "audio/webm",
    "audio/ogg",
    "audio/x-m4a",
    "audio/mp4",
    "application/octet-stream",  # Some browsers send this for audio files
}


async def convert_to_wav(file_content: bytes, original_format: str) -> BytesIO:
    """Convert audio file to WAV format using pydub."""
    try:
        # Create a temporary file to store the original audio
        with tempfile.NamedTemporaryFile(suffix=original_format, delete=False) as temp_input:
            temp_input.write(file_content)
            temp_input_path = temp_input.name

        try:
            # Determine the format based on extension
            format_map = {
                ".mp3": "mp3",
                ".webm": "webm",
                ".ogg": "ogg",
                ".oga": "ogg",
                ".m4a": "m4a",
                ".wav": "wav",
            }
            
            audio_format = format_map.get(original_format.lower(), "wav")
            
            # Load and convert to WAV
            audio = AudioSegment.from_file(temp_input_path, format=audio_format)
            
            # Export to WAV in memory
            wav_buffer = BytesIO()
            audio.export(wav_buffer, format="wav")
            wav_buffer.seek(0)
            
            return wav_buffer
            
        finally:
            # Clean up temporary file
            os.unlink(temp_input_path)
            
    except Exception as e:
        Logger.error(f"[convert_to_wav] Error converting audio: {e}")

        raise ValueError(f"Failed to convert audio file: {str(e)}")


async def load_and_extract_spectrogram(
    audio_data: BytesIO, n_mels: int = 128, n_fft: int = 1024, hop_length: int = 512
) -> np.ndarray:
    """Extract mel spectrogram from audio data."""
    y, sr = librosa.load(audio_data, sr=None)

    mel_spec: np.ndarray = librosa.feature.melspectrogram(
        y=y, sr=sr, n_fft=n_fft, hop_length=hop_length, n_mels=n_mels
    )
    mel_spec_db: np.ndarray = librosa.power_to_db(mel_spec, ref=np.max)

    return mel_spec_db


def get_file_extension(filename: str) -> str:
    """Get the file extension from filename."""
    if not filename:
        return ""

    return os.path.splitext(filename)[1].lower()


router: APIRouter = APIRouter(prefix="/classify", tags=["Classify"])


@limiter.limit("30/minute")
@router.post("/")
async def upload_file(request: Request, file: UploadFile = File(...)):
    try:
        Logger.debug(f"[/api/classify] Received file: {file.filename}")

        # Get file extension
        file_extension = get_file_extension(file.filename)
        
        # Validate file extension
        if file_extension not in ALLOWED_EXTENSIONS:
            Logger.debug(f"[/api/classify] Invalid file extension: {file_extension}")
            return Response[None](
                success=False,
                status=ResponseStatusEnum.BAD_REQUEST_400,
                message=f"Invalid file type. Supported formats: WAV, MP3, WebM, OGG, M4A",
                data=None,
            )

        # Read file content
        file_content = await file.read()
        file_size = len(file_content)

        # Validate file size
        if file_size > MAX_FILE_SIZE_BYTES:
            Logger.debug(f"[/api/classify] File too large: {file_size} bytes")
            return Response[None](
                success=False,
                status=ResponseStatusEnum.BAD_REQUEST_400,
                message=f"File too large. Maximum size is {MAX_FILE_SIZE_MB}MB",
                data=None,
            )

        if file_size == 0:
            Logger.debug("[/api/classify] Empty file received")
            return Response[None](
                success=False,
                status=ResponseStatusEnum.BAD_REQUEST_400,
                message="Empty file received",
                data=None,
            )

        # Convert to WAV if necessary
        Logger.debug(f"[/api/classify] Processing audio file (format: {file_extension})")
        
        if file_extension != ".wav":
            Logger.debug(f"[/api/classify] Converting {file_extension} to WAV")
            try:
                audio_data = await convert_to_wav(file_content, file_extension)

            except ValueError as e:
                return Response[None](
                    success=False,
                    status=ResponseStatusEnum.BAD_REQUEST_400,
                    message=str(e),
                    data=None,
                )

        else:
            audio_data = BytesIO(file_content)

        # Extract spectrogram
        Logger.debug("[/api/classify] Extracting spectrogram")
        X = []
        max_time_steps: int = 128
        spectrogram: np.ndarray = await load_and_extract_spectrogram(audio_data)
        
        if spectrogram.shape[1] < max_time_steps:
            pad_width: int = max_time_steps - spectrogram.shape[1]
            spectrogram_padded: np.ndarray = np.pad(
                spectrogram, ((0, 0), (0, pad_width)), mode="constant"
            )
            X.append(spectrogram_padded)

        else:
            X.append(spectrogram[:, :max_time_steps])

        X = np.array(X)
        X = X[..., np.newaxis]

        # Predict
        Logger.debug("[/api/classify] Running prediction")
        loaded_model(X)
        prediction: np.ndarray = loaded_model.predict(X)
        indices: np.intp = np.argmax(prediction)
        
        # Get confidence score (probability for the predicted class)
        confidence: float = float(prediction[0][indices])
        confidence_percent: str = f"{confidence * 100:.1f}%"
        is_ambulance: bool = bool(indices == 0)  # Convert numpy bool to Python bool

        Logger.debug(
            f"[/api/classify] Result: {indices}, {['Ambulance', 'Traffic Noise'][indices]}, Confidence: {confidence_percent}"
        )

        # Add to history
        Logger.debug("[/api/classify] Adding to history")
        try:
            with open("src/history.json", "r") as json_file:
                data = json.load(json_file)

                if type(data) is not list:
                    data = []

        except FileNotFoundError:
            data = []

        data.append(
            {
                "id": 1 if len(data) == 0 else data[-1]["id"] + 1,
                "result": is_ambulance,
                "confidence": confidence,
                "createdAt": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }
        )

        with open("src/history.json", "w") as json_file:
            json.dump(data, json_file, indent=4)

        # Return response with confidence scores
        return Response[dict](
            success=True,
            status=ResponseStatusEnum.CREATED_201,
            message="Classification successful",
            data={
                "isAmbulance": is_ambulance,
                "confidence": confidence,
                "confidencePercent": confidence_percent,
            },
        )

    except Exception as e:
        Logger.error(f"[/api/classify] Error: {e}")

        return Response[None](
            success=False,
            status=ResponseStatusEnum.INTERNAL_SERVER_ERROR_500,
            message="Internal Server Error. Please try again.",
            data=None,
        )
