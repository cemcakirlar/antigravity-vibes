#!/bin/bash

# Orion Dev Status Script
# Shows the status of Orion dev servers

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 Orion Dev Environment Status${NC}"
echo ""

# Check Backend
if lsof -i :3000 > /dev/null 2>&1; then
    PID=$(lsof -ti :3000 | head -1)
    echo -e "  Backend (port 3000):  ${GREEN}● Running${NC} (PID: $PID)"
else
    echo -e "  Backend (port 3000):  ${RED}○ Stopped${NC}"
fi

# Check Frontend
if lsof -i :5173 > /dev/null 2>&1; then
    PID=$(lsof -ti :5173 | head -1)
    echo -e "  Frontend (port 5173): ${GREEN}● Running${NC} (PID: $PID)"
else
    echo -e "  Frontend (port 5173): ${RED}○ Stopped${NC}"
fi

echo ""
