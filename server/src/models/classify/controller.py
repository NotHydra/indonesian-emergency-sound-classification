from io import BytesIO

import keras
import librosa
import numpy as np
from fastapi import APIRouter, File, UploadFile

from common.enums.response import ResponseStatusEnum
from utilities.logger import Logger
from utilities.response import Response

loaded_model = keras.models.load_model("model.h5")


async def load_and_extract_spectrogram(
    file: UploadFile, n_mels: int = 128, n_fft: int = 1024, hop_length: int = 512
) -> np.ndarray:
    y, sr = librosa.load(BytesIO(await file.read()), sr=None)

    mel_spec: np.ndarray = librosa.feature.melspectrogram(
        y=y, sr=sr, n_fft=n_fft, hop_length=hop_length, n_mels=n_mels
    )
    mel_spec_db: np.ndarray = librosa.power_to_db(mel_spec, ref=np.max)

    return mel_spec_db


router: APIRouter = APIRouter(prefix="/classify", tags=["Classify"])


@router.post("/")
async def upload_file(file: UploadFile = File(...)) -> bool:
    try:
        Logger.debug(f"[/api/classify] Received file: {file.filename}")

        Logger.debug(f"[/api/classify] Extract spectrogram")
        X = []
        max_time_steps: int = 128
        spectrogram: np.ndarray = await load_and_extract_spectrogram(file)
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

        Logger.debug(f"[/api/classify] Predict")
        loaded_model(X)
        prediction: np.ndarray = loaded_model.predict(X)
        indices: np.intp = np.argmax(prediction)

        Logger.debug(
            f"[/api/classify] Result: {indices}, {['Traffic Noise', 'Ambulance'][indices]}"
        )

        return Response[bool](
            success=True,
            status=ResponseStatusEnum.CREATED_201,
            message="Success",
            data=True if indices == 1 else False,
        )

    except Exception as e:
        Logger.error(f"[/api/classify] Error: {e}")

        return Response[None](
            success=False,
            status=ResponseStatusEnum.INTERNAL_SERVER_ERROR_500,
            message="Internal Server Error",
            data=None,
        )
