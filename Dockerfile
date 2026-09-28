# syntax=docker/dockerfile:1

# --- Стадия 1: установка всех зависимостей (включая dev) ---
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci

# --- Стадия 2: сборка фронтенда и бэкенда ---
FROM deps AS build
COPY . .
RUN npm run build

# --- Стадия 3: runtime — только prod-зависимости API и собранные артефакты ---
FROM node:24-alpine AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --omit=dev --workspace=@app/api && npm cache clean --force
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/web/dist ./apps/web/dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/api/dist/index.js"]
