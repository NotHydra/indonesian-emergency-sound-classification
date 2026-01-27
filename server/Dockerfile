FROM python:3.10 AS base

WORKDIR /app

# Install ffmpeg and libsndfile for audio format conversion
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./

RUN pip install -r requirements.txt

COPY src ./src
COPY model.h5 .



FROM base AS development

CMD python src/main.py --reload



FROM base AS production

CMD python src/main.py