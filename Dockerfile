FROM node:22-alpine

WORKDIR /app

COPY . .

RUN npm install

ENV DATABASE_URL=file:/app/data/scrivenry.db
ENV NODE_ENV=production
RUN npm run build

# Copy static assets to standalone directory
RUN cp -r .next/static .next/standalone/.next/

# Create a startup script that seeds the database
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'node .next/standalone/server.js &' >> /start.sh && \
    echo 'sleep 3' >> /start.sh && \
    echo 'node -e "const Database = require(\"better-sqlite3\"); const crypto = require(\"crypto\"); const {v4: uuid} = require(\"uuid\"); const db = new Database(\"./data/scrivenry.db\"); try { const existing = db.prepare(\"SELECT id FROM users WHERE email = ?\").get(\"justyn@fintonlabs.com\"); if (!existing) { const userId = uuid(); const hashed = crypto.createHash(\"sha256\").update(\"Scrivenry123!\").digest(\"hex\"); const now = new Date().toISOString(); db.prepare(\"INSERT INTO users (id, email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)\").run(userId, \"justyn@fintonlabs.com\", hashed, \"Justyn\", now, now); console.log(\"User created\"); } } catch(e) { console.log(\"User exists or error:\", e.message); } db.close();" 2>&1' >> /start.sh && \
    echo 'wait' >> /start.sh && \
    chmod +x /start.sh

EXPOSE 3847
ENV PORT=3847
ENV AUTH_SECURE_COOKIES=true
CMD ["/start.sh"]
