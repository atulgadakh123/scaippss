FROM node:18

WORKDIR /app

# 1️⃣ Only package files
COPY package*.json ./
RUN npm install

# 2️⃣ Copy source code (node_modules excluded by .dockerignore)
COPY . .

# 3️⃣ Generate prisma INSIDE container
RUN npx prisma generate

EXPOSE 5000
CMD ["npm", "start"]
