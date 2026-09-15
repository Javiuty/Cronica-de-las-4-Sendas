# Base con las dependencias ya instaladas.
FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Desarrollo: el servidor de Vite, con recarga en caliente.
FROM base AS desarrollo
COPY . .
EXPOSE 5173
CMD ["pnpm", "dev", "--host", "0.0.0.0"]

# Producción: se compila a estáticos y los sirve nginx.
FROM base AS compilacion
COPY . .
RUN pnpm build

FROM nginx:alpine AS produccion
COPY --from=compilacion /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
