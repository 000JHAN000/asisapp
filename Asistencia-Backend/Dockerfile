# ============================================================
#  ChronoGest — Backend Dockerfile (NestJS)
# ============================================================

FROM node:20-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm install --force
COPY . .
EXPOSE 3001
CMD ["npm", "run", "start:dev"]

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

FROM node:20-alpine AS prod
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/main"]
