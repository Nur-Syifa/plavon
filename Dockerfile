FROM node:18  # ganti dari slim ke full

RUN apt-get update && apt-get install -y python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm rebuild sqlite3 --build-from-source  # <--- PAKSA BUILD ULANG
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
