FROM node:18-slim

# Install tools buat build sqlite3
RUN apt-get update && apt-get install -y python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
