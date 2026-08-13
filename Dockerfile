FROM node:22-slim

WORKDIR /app

# Copy backend
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --only=production

# Copy schema and seed
COPY backend/schema.sql ./
COPY backend/seed.js ./

# Copy source
COPY backend/src ./src

# Expose port
EXPOSE 8080

# Set production env
ENV NODE_ENV=production
ENV PORT=8080

# Start
CMD ["npm", "start"]
