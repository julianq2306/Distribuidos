# Imagen base liviana de Python 3.11
FROM python:3.11-slim

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Instala compiladores para dependencias que requieren build,
# y netcat para verificar la disponibilidad de PostgreSQL antes de arrancar
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    netcat-openbsd

# Copia primero requirements.txt para aprovechar la caché de Docker:
# si no cambia, no se reinstalan las dependencias en builds posteriores
COPY requirements.txt .

# Instala las dependencias de Python sin guardar caché (imagen más liviana)
RUN pip install --no-cache-dir -r requirements.txt

# Copia el resto del código de la aplicación al contenedor
COPY . .

# Espera a que PostgreSQL esté disponible en el puerto 5432 antes de
# levantar el servidor FastAPI con Uvicorn en el puerto 8001
CMD sh -c "until nc -z postgres 5432; do echo 'Esperando PostgreSQL...'; sleep 2; done; uvicorn main:app --host 0.0.0.0 --port 8001"