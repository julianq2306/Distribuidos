FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    netcat-openbsd

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD sh -c "until nc -z postgres 5432; do echo 'Esperando PostgreSQL...'; sleep 2; done; uvicorn main:app --host 0.0.0.0 --port 8001"