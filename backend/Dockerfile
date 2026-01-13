FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV NODE_ENV=production

EXPOSE 3000

# 🔥 KEY LINE: Windows prisma force delete + Linux generate
CMD ["sh", "-c", "rm -rf node_modules/.prisma && npx prisma generate && npm start"]
