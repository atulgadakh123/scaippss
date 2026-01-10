FROM node:18-bullseye

# 1. Install OpenSSL (VERY IMPORTANT for Prisma)
RUN apt-get update && apt-get install -y openssl

# 2. Set working directory
WORKDIR /app

# 3. Copy package files
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy source code
COPY . .

# 6. Generate Prisma Client
 RUN npx prisma generate

# 7. Expose port
EXPOSE 5000

# 8. Start app (FIXED)
CMD ["node", "server.js"]
