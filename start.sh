#!/bin/bash
# ──────────────────────────────────────────────────────────────
# כלי הערכה פדגוגית — הפעלת שרת
# ──────────────────────────────────────────────────────────────

cd "$(dirname "$0")"

# Load nvm and switch to Node 22
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
nvm use 22 --silent 2>/dev/null || true

# Kill any existing instance on port 3001
if lsof -i :3001 -t &>/dev/null; then
  echo "Stopping existing server on port 3001..."
  lsof -i :3001 -t | xargs kill -9 2>/dev/null
  sleep 1
fi

# Build the frontend if needed (comment out if you prefer to pre-build)
if [ ! -f "client/dist/index.html" ]; then
  echo "Building frontend..."
  cd client && npm run build 2>/dev/null && cd ..
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   כלי הערכה פדגוגית — פיילוט                        ║"
echo "║                                                      ║"
echo "║   כתובת: http://localhost:3001                       ║"
echo "║   מייל:  yearad@dyellin.ac.il                        ║"
echo "║   סיסמה: pilot2026                                   ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

node server.js
