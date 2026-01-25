#!/bin/sh

echo "Waiting for Database to accept connections..."
until nc -z mongo 27017; do
  echo "Waiting for Mongo..."
  sleep 1
done

echo "DB Connection Successful! Syncing Schema..."
npx prisma@6.19 db push --accept-data-loss

echo "Starting Next.js..."
export HOSTNAME="0.0.0.0"
node server.js