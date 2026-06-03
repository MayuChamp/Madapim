#!/bin/bash
# Start the כלי הערכה פדגוגית server
# Usage: ./start.sh

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
nvm use 22.12.0 --silent 2>/dev/null || true

echo "Starting כלי הערכה פדגוגית on http://localhost:3001"
node server.js
