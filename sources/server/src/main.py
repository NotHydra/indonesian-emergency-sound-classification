from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from io import BytesIO
from types import FunctionType

import librosa
import numpy as np
import keras

loaded_model: FunctionType = keras.models.load_model("model.h5")


async def load_and_extract_spectrogram(
    file: UploadFile, n_mels: int = 128, n_fft: int = 1024, hop_length: int = 512
) -> np.ndarray:
    y, sr = librosa.load(BytesIO(await file.read()), sr=None)

    mel_spec: np.ndarray = librosa.feature.melspectrogram(
        y=y, sr=sr, n_fft=n_fft, hop_length=hop_length, n_mels=n_mels
    )
    mel_spec_db: np.ndarray = librosa.power_to_db(mel_spec, ref=np.max)

    return mel_spec_db


app: FastAPI = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/classify")
async def upload_file(file: UploadFile = File(...)) -> bool:
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

    loaded_model(X)
    prediction: np.ndarray = loaded_model.predict(X)
    indices = np.argmax(prediction)

    return True if indices == 0 else False


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=3001)
