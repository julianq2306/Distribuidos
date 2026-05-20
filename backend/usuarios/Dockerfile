# Imagen base: Node.js 18 en Alpine Linux (versión ligera)
FROM node:18-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar archivos de dependencias primero (aprovecha caché de Docker)
COPY package*.json ./

# Instalar solo dependencias de producción (sin devDependencies)
RUN npm install --production

# Copiar el código fuente de la aplicación
COPY src/ ./src/

# Exponer el puerto 3000 (documentativo, no abre el puerto automáticamente)
EXPOSE 3000

# Comando para iniciar el servidor cuando el contenedor arranque
CMD ["node", "src/index.js"]