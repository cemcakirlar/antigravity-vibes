#!/bin/bash

# Orion Dev Environment Stop Script
# This script stops both backend and frontend dev servers

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Stopping Orion Dev Environment...${NC}"
echo ""

stopped_something=false

# Kill processes on port 3000 (Backend)
if lsof -i :3000 > /dev/null 2>&1; then
    echo -e "${BLUE}Stopping Backend (port 3000)...${NC}"
    # Get PIDs of processes using port 3000
    PIDS=$(lsof -ti :3000)
    for pid in $PIDS; do
        kill -9 $pid 2>/dev/null
    done
    sleep 1
    if ! lsof -i :3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend stopped${NC}"
        stopped_something=true
    else
        echo -e "${RED}✗ Failed to stop backend${NC}"
    fi
else
    echo -e "${YELLOW}Backend not running${NC}"
fi

# Kill processes on port 5173 (Frontend)
if lsof -i :5173 > /dev/null 2>&1; then
    echo -e "${BLUE}Stopping Frontend (port 5173)...${NC}"
    PIDS=$(lsof -ti :5173)
    for pid in $PIDS; do
        kill -9 $pid 2>/dev/null
    done
    sleep 1
    if ! lsof -i :5173 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend stopped${NC}"
        stopped_something=true
    else
        echo -e "${RED}✗ Failed to stop frontend${NC}"
    fi
else
    echo -e "${YELLOW}Frontend not running${NC}"
fi

# Clean up PID files
rm -f /tmp/orion-backend.pid /tmp/orion-frontend.pid 2>/dev/null

echo ""
if [ "$stopped_something" = true ]; then
    echo -e "${GREEN}🎉 Orion Dev Environment stopped successfully!${NC}"
else
    echo -e "${YELLOW}Nothing to stop - Orion was not running.${NC}"
fi
