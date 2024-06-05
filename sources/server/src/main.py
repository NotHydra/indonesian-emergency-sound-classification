from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app: FastAPI = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/classify")
async def upload_file(file: UploadFile = File())->str:
    return file.filename

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=3001)
