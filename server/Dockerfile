FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build:admin

FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=8787 CMS_BIND_HOST=0.0.0.0 CMS_DATA_DIR=/data
COPY --from=build /app/dist-admin ./dist-admin
COPY server ./server
COPY src/content/schema.js ./src/content/schema.js
COPY package.json ./package.json
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME ["/data"]
EXPOSE 8787
CMD ["node", "--use-env-proxy", "server/cms.mjs"]
