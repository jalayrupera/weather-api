FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the rest of the application (not needed for local development since we're mounting the volume)
# COPY . .

# Expose port
EXPOSE 3000

# Set the correct API URL for development
ENV NEXT_PUBLIC_API_BASE_URL=http://backend:8000
ENV NODE_ENV=development
ENV WATCHPACK_POLLING=true

# Run the development server
CMD ["npm", "run", "dev"] 