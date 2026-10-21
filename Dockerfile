FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY src ./src
USER node
ENV HOST=0.0.0.0
EXPOSE 3000
CMD ["node", "src/server.js"]
