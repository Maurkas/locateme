# Фаза сборки
FROM node:20-bullseye AS builder
WORKDIR /app

# Установка зависимостей
COPY package.json package-lock.json ./
RUN npm ci --silent --no-optional
RUN npm install @rollup/rollup-linux-x64-gnu

# Сборка проекта
COPY . .

# Фаза запуска
EXPOSE 5173
CMD ["npm", "run", "dev"]

EXPOSE 80