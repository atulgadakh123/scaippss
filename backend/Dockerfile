FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV DATABASE_URL="dummy"
RUN npx prisma generate

EXPOSE 5000
CMD ["node", "server.js"]
