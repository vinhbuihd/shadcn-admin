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

# Install ONLY production dependencies
RUN yarn install --production

# Copy compiled JavaScript từ stage 1
COPY --from=builder /app/dist ./dist

# Copy drizzle migrations
COPY drizzle ./drizzle

# Expose port (thông báo container dùng port này, không binding tự động)
EXPOSE 3043

# Chạy app
CMD ["node", "dist/server.js"]
