FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json ./
COPY src ./src
RUN npm run build

FROM build AS tests
COPY test ./test
COPY migrations ./migrations
COPY vitest.config.ts ./
CMD ["npm", "test"]

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY migrations ./migrations
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
