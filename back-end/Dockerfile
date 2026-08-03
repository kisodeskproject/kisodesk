# ---- build stage ----
    FROM node:20-alpine AS build
    WORKDIR /app
    COPY package*.json ./
    RUN npm ci --legacy-peer-deps
    COPY . .
    RUN npx prisma generate
    RUN npx tsc -p tsconfig.build.json && test -f dist/scripts/index-practice-corpus.js && test -f dist/scripts/sync-practice-texts.js
    
    # ---- producción stage ----
    FROM node:20-alpine
    WORKDIR /app
    ENV NODE_ENV=production
    COPY --from=build /app/package*.json ./
    COPY --from=build /app/node_modules ./node_modules
    COPY --from=build /app/dist ./dist
    COPY --from=build /app/prisma ./prisma
    COPY --from=build /app/scripts/db ./scripts/db
    COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
    
    # Cambiar propietario de todo /app al usuario node
    RUN chown -R node:node /app
    
    USER node
    EXPOSE 3000
    CMD ["node", "-r", "reflect-metadata", "dist/main.js"]
