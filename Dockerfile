FROM node:22-alpine

WORKDIR /app

COPY . .

RUN npm install

ENV DATABASE_URL=file:/app/data/scrivenry.db
ENV NODE_ENV=production
RUN npm run build

# Copy static assets to standalone directory
RUN cp -r .next/static .next/standalone/.next/

RUN chmod +x entrypoint.sh

EXPOSE 3847
ENV PORT=3847
ENV AUTH_SECURE_COOKIES=true

# Next's standalone server binds process.env.HOSTNAME, which Docker sets to the
# container ID — so without this it listens only on the container's own address
# and nothing on loopback can reach it, including the healthcheck below.
ENV HOSTNAME=0.0.0.0

# basePath is /scrivenry (next.config.js), so / is a 404 by design.
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3847/scrivenry/login >/dev/null 2>&1 || exit 1

# Applies migrations, then starts the server. JWT_SECRET must be supplied at
# runtime — the app refuses to sign tokens without it.
CMD ["./entrypoint.sh"]
