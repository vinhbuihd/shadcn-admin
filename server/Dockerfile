# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies (cả dev)
RUN yarn install

# Copy source code
COPY . .

# Compile TypeScript → JavaScript
RUN yarn build

# Stage 2: Runtime
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies (giữ luôn devDependencies vì cần drizzle-kit để migrate lúc start)
RUN yarn install

# Copy compiled JavaScript từ stage 1
COPY --from=builder /app/dist ./dist

# Copy drizzle migrations + config (drizzle-kit cần drizzle.config.ts để biết migrations folder)
COPY drizzle ./drizzle
COPY drizzle.config.ts ./

# Expose port (thông báo container dùng port này, không binding tự động)
EXPOSE 3043

# Chạy migration trước, an toàn vì idempotent, rồi mới start app
CMD ["sh", "-c", "yarn db:migrate && node dist/server.js"]
