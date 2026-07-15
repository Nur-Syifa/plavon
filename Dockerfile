FROM node:18

RUN apt-get update && apt-get install -y python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm rebuild sqlite3 --build-from-source
RUN npm install --production

COPY .

EXPOSE 3000

CMD ["node", "server.js"]
