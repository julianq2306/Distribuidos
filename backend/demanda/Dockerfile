# Imagen base liviana de Python 3.11
FROM python:3.11-slim

# Directorio de trabajo dentro del contenedor
WORKDIR /app

<<<<<<< HEAD
# Instala compiladores necesarios para algunas dependencias de Python
# (por ejemplo, paquetes que requieren build desde código fuente)
RUN apt-get update && apt-get install -y \
    gcc \
    g++

# Copia primero requirements.txt para aprovechar la caché de Docker:
# si no cambia, no se reinstalan las dependencias en builds posteriores
=======
>>>>>>> 45a195beb2aa31f15742fff35f57c9ea2379826e
COPY requirements.txt .

# Instala las dependencias de Python sin guardar caché (imagen más liviana)
RUN pip install --no-cache-dir -r requirements.txt

# Copia el resto del código de la aplicación al contenedor
COPY . .

# Levanta el servidor FastAPI con Uvicorn en el puerto 8001,
# escuchando en todas las interfaces (0.0.0.0) para ser accesible desde fuera del contenedor
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]