#!/bin/sh
set -e

# Start the Next.js app in background
node .next/standalone/server.js &
NODE_PID=$!

# Wait for app to boot and initialize database
sleep 3

# Create the user if it doesn't exist
node -e "
const Database = require('better-sqlite3');
const crypto = require('crypto');
const { v4: uuid } = require('uuid');

const db = new Database('./data/scrivenry.db');
const email = 'justyn@fintonlabs.com';

try {
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (!existingUser) {
    const userId = uuid();
    const password = 'Scrivenry123!';
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    const now = new Date().toISOString();
    
    db.prepare(\`
      INSERT INTO users (id, email, password_hash, name, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?)
    \`).run(userId, email, hashedPassword, 'Justyn', now, now);
    
    console.log('User created: ' + email);
  } else {
    console.log('User already exists');
  }
} catch (e) {
  console.error('Error:', e.message);
}

db.close();
" || true

# Wait for the app process
wait $NODE_PID
