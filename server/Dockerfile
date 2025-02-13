FROM python:3.10 AS base

WORKDIR /app

COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

COPY src ./src
COPY model.h5 .



FROM base AS development

CMD python src/main.py --reload



FROM base AS production

CMD python src/main.py