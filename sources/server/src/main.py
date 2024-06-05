from fastapi import FastAPI, File, UploadFile

app: FastAPI = FastAPI()

@app.post("/classify")
async def upload_file(file: UploadFile = File())->str:
    return file.filename

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=3001)
