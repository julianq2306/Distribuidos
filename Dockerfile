FROM python:3.11-slim

WORKDIR /app

COPY backend/demanda/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY backend/demanda/ .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]