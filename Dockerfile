FROM node:18-slim

RUN apt-get update && apt-get install -y python3 make g++

WORKDIR /app

COPY package*.json ./
RUN rm -rf node_modules package-lock.json  # <--- TAMBAH INI
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
