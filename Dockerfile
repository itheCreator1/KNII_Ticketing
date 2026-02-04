FROM node:20-slim

# Install required packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    postgresql-client \
    netcat-openbsd \
    bash \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Use secure HTTPS registry (SSL verification enabled by default)
RUN npm config set registry https://registry.npmjs.org/

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Bundle app source
COPY . .

# Build Tailwind CSS
RUN npm run build:css

# Copy and set permissions for entrypoint script
# Convert line endings from Windows (CRLF) to Unix (LF) if needed
COPY scripts/docker-entrypoint.sh /usr/local/bin/
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

# Use entrypoint script
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD [ "node", "index.js" ]
