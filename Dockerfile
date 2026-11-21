FROM node:20-bookworm

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["./docker/entrypoint.sh"]
