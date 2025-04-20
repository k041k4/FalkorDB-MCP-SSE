FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copy necessary configuration files
COPY --from=builder /app/.env.example ./.env

# Install production dependencies only
RUN npm ci --only=production

# Expose the port the app runs on
EXPOSE 3000

# Run the application
CMD ["node", "dist/index.js"]