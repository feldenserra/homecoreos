#!/bin/bash
set -e

KEY_FILE='/data/db/replica.key'

# --- 1. Automatic Security ---
if [ ! -f "$KEY_FILE" ]; then
  echo "🔑 Generating secure keyfile..."
  head -c 756 /dev/urandom | base64 > "$KEY_FILE"
  chmod 400 "$KEY_FILE"
  chown mongodb:mongodb "$KEY_FILE"
fi

# --- 2. Robust Background Helper ---
# Run in background (&) so we don't block the database startup
(
  echo "⏳ Helper: Waiting for Mongo to start..."
  
  # We loop until we can successfully AUTHENTICATE and check status
  while true; do
    sleep 3
    
    # Try to connect with credentials. If this fails, Mongo isn't ready yet.
    # We use 'admin' database for authentication.
    STATUS=$(mongosh --port 27017 -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --quiet --eval "try { rs.status().ok } catch(e) { 0 }" 2>/dev/null || echo "0")
    
    if [ "$STATUS" == "1" ]; then
      echo "✅ Helper: Replica Set is already RUNNING. Exiting."
      break
    fi

    echo "⚙️  Helper: Database is up. Attempting authenticated init..."
    
    # Try to initiate using CREDENTIALS
    mongosh --port 27017 -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --quiet --eval "
      try {
        rs.initiate({_id:'rs0', members:[{_id:0, host:'local-mongo:27017'}]});
        print('🚀 Success: Replica Set Initialized!');
      } catch (e) {
        print('⚠️  Init failed: ' + e.message);
      }
    " 2>/dev/null
  done
) &

# --- 3. Start the Real Database ---
echo "🏁 Starting MongoDB..."
exec docker-entrypoint.sh mongod --replSet rs0 --bind_ip_all --keyFile "$KEY_FILE"