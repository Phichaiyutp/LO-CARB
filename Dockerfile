# Use the official Node.js image as base
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app’s source code
COPY . .

# Build the app
RUN npm run build

# Expose the port (same as used in NestJS)
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]
