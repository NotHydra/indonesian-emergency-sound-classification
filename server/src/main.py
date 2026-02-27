import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse

from config import limiter
from models.classify.controller import router as classify_router

load_dotenv()


app: FastAPI = FastAPI(root_path="/api")

# Add rate limit exception handler
@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request, exc):
    return JSONResponse(
        status_code=429,
        content={
            "success": False,
            "status": 429,
            "message": "Rate limit exceeded. Maximum 30 requests per minute allowed.",
            "data": None,
        },
    )

app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://ambulance.demo.irswanda.com",
        "https://www.ambulance.demo.irswanda.com",
    ],
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["*"],
)

app.include_router(classify_router)


@app.get("/")
async def main() -> str:
    return "API for ambulance.irswanda.com"


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT")))
