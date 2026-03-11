FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# Required by the Docker healthcheck in docker-compose.
RUN apk add --no-cache wget

COPY . .

EXPOSE 9001

ENV NODE_ENV=production
ENV PORT=9001

CMD ["node", "src/index.js"]
