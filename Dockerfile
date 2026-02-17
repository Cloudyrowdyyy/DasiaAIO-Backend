# Stage 1: Build the React+Vite app
FROM node:20-alpine as builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Build the app
COPY . .
RUN npm run build

# Stage 2: Serve the app with a simple server
FROM node:20-alpine

WORKDIR /app

# Install serve package to serve the static files
RUN npm install -g serve

# Copy built app from builder stage
COPY --from=builder /app/app-dist ./app-dist

# Expose port (Railway uses dynamic port from $PORT)
EXPOSE 3000

# Environment variable for API URL will be passed by Railway
ENV VITE_API_URL=${VITE_API_URL:-http://localhost:5000}

# Start the app (serve only needs port number)
CMD ["/bin/sh", "-c", "serve -s app-dist -l ${PORT:-3000}"]
