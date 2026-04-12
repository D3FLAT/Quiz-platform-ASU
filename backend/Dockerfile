FROM node:18-alpine

RUN apk add --no-cache dos2unix python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN find . -name "*.js" -not -path "./node_modules/*" | xargs dos2unix

EXPOSE 5000

CMD ["node", "server.js"]