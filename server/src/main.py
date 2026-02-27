import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from model_manager import model_manager
from models.classify.controller import router as classify_router

load_dotenv()


app: FastAPI = FastAPI(root_path="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://ambulance.demo.irswanda.com",
        "https://www.ambulance.demo.irswanda.com",
    ],
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

app.include_router(classify_router)


@app.get("/")
async def main() -> str:
    return "API for ambulance.irswanda.com"


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint for monitoring and load balancers."""
    
    return {
        "status": "healthy",
        "service": "Indonesian Emergency Sound Classification API Server",
        "model": {
            "is_loaded": model_manager.is_model_loaded(),
            "message": "loaded" if model_manager.is_model_loaded() else "not loaded yet",
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT")))
