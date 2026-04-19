FROM node:18

WORKDIR /app

COPY server/package*.json ./server/
RUN cd server && npm install

COPY server ./server

# IMPORTANT: copy public folder
COPY public ./public

WORKDIR /app/server

EXPOSE 5000

CMD ["node", "server.js"]