# Stage 1: Build the application
FROM node:20 AS builder

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Stage 2: Create the runtime image
FROM node:20-slim

# Create app directory
WORKDIR /usr/src/app

# Copy only the necessary files from the builder stage
COPY --from=builder /usr/src/app .

# Install cross-env globally
RUN npm install -g cross-env

# Install only production dependencies
RUN npm install --production

# Expose the port the app runs on
ARG APP_PORT=31531

# Set an environment variable to use the port
ENV PORT=$APP_PORT

# Expose the port
EXPOSE $PORT

# Expose the environment the app runs in
ARG ENVIRONMENT=staging
ENV NODE_ENV=$ENVIRONMENT

# Command to run the app based on the ENVIRONMENT argument
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = 'production' ]; then npm run start; else npm run staging; fi"]