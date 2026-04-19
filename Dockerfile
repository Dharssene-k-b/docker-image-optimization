FROM node:18-alpine AS builder
WORKDIR /app
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --omit=dev
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/server/node_modules .server/node_modules
COPY . .
EXPOSE 5000
CMD ["node","server/server.js"]
