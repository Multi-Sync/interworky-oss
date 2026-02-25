# Use the official Node.js LTS Alpine base image
FROM node:lts-alpine AS base

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Start a new stage for the production image
FROM node:lts-alpine AS production

# Set the working directory
WORKDIR /app

# Copy the necessary files from the build stage
COPY --from=base /app/package*.json ./
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/next.config.mjs ./
COPY --from=base /app/.env* ./

# Expose the port the app runs on
ARG APP_PORT=31531

# Set an environment variable to use the port
ENV PORT=$APP_PORT

# Expose the port
EXPOSE $PORT


# Command to run the application
CMD ["npm", "start"]
