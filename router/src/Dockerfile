FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json tsconfig.json ./
RUN npm ci
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
COPY package*.json ./
RUN npm ci --production && npm cache clean --force
COPY --from=builder /app/dist/ ./dist/
VOLUME [ "/app/data" ]
EXPOSE 3000
ENTRYPOINT ["node", "dist/index.js"]
