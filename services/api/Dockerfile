FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ENV PORT=8787 SUKIMA_DB_PATH=/data/sukima.db
VOLUME ["/data"]
EXPOSE 8787
CMD ["node","server.mjs"]
