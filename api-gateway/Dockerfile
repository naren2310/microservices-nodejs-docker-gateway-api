FROM node:14-alpine

# Set the working directory
WORKDIR /Mobile_Api_Prod/api_gateway

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install the Node.js dependencies and clean the npm cache in a single step
RUN npm ci --quiet --no-optional --no-progress && npm cache clean --force

# Copy the rest of the application code
COPY . .

# Exclude unnecessary files using .dockerignore
COPY .dockerignore ./

# Expose the port for the application
EXPOSE 5000

# Start the application
CMD [ "npm", "start" ]
