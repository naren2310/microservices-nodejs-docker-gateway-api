FROM node:14-alpine

# Set the working directory
WORKDIR /Mobile_Api_Prod/mobile_api_get_block_list

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install the Node.js dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port for the application
EXPOSE 5000

# Start the application
CMD [ "npm", "start" ]
