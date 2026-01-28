FROM python:3.10 AS base

WORKDIR /app

# Install ffmpeg and libsndfile for audio format conversion
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    wget \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./

RUN pip install -r requirements.txt

COPY src ./src

# Download model from external source
ARG MODEL_URL
RUN if [ -n "$MODEL_URL" ]; then \
        wget -O model.h5 "$MODEL_URL"; \
    else \
        echo "MODEL_URL not provided, skipping model download"; \
    fi



FROM base AS development

CMD python src/main.py --reload



FROM base AS production

CMD python src/main.py