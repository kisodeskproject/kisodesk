FROM node:20-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-slim AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ARG SERVER_API_URL
ARG NEXT_PUBLIC_OBSERVABILITY_SAMPLE_RATE=0.1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV SERVER_API_URL=$SERVER_API_URL
ENV NEXT_PUBLIC_OBSERVABILITY_SAMPLE_RATE=$NEXT_PUBLIC_OBSERVABILITY_SAMPLE_RATE

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
RUN chown -R node:node /app
USER node
EXPOSE 3000
CMD ["npm", "start"]
