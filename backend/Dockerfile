# Small Linux + Node.js 20
FROM node:20-alpine

# Workdir inside the image
WORKDIR /app

# Copy only package manifests first (good for caching even if we add deps later)
COPY package*.json ./

# Install prod deps (we have none now, but this is the right pattern)
RUN npm ci --omit=dev || npm install --omit=dev

# Copy the app code
COPY . .

# Document the port
EXPOSE 3000

# Start the app
CMD ["node", "server.js"]
