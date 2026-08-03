#!/bin/sh
set -e

# Bring the database up to date before serving. Migrations do not run on their
# own, so a fresh volume without this step yields "no such table: users" while
# the login page renders perfectly — a confusing failure worth avoiding.
node scripts/bootstrap.js

exec node .next/standalone/server.js
