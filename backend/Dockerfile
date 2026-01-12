FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV NODE_ENV=production

EXPOSE 3000

# ⚠️ Prisma build time ला नाही, runtime ला
CMD ["sh", "-c", "rm -rf node_modules/.prisma && npx prisma generate && npm start"]
