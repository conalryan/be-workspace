#!/bin/bash

# Feature Flags System - Setup Script
# This script sets up the complete feature flags system

set -e

echo "🚀 Feature Flags System Setup"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if PostgreSQL is installed
echo -e "${BLUE}Checking PostgreSQL installation...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${RED}PostgreSQL is not installed!${NC}"
    echo "Install it with: brew install postgresql@18"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL is installed${NC}"
echo ""

# Check if PostgreSQL is running
echo -e "${BLUE}Checking PostgreSQL service...${NC}"
if ! pg_isready -q; then
    echo -e "${YELLOW}PostgreSQL is not running. Starting it...${NC}"
    brew services start postgresql@18 || brew services start postgresql
    sleep 2
fi
echo -e "${GREEN}✓ PostgreSQL is running${NC}"
echo ""

# Create database
echo -e "${BLUE}Setting up database...${NC}"
if psql postgres -lqt | cut -d \| -f 1 | grep -qw feature_flags; then
    echo -e "${YELLOW}Database 'feature_flags' already exists.${NC}"
    read -p "Drop and recreate? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        psql postgres -c "DROP DATABASE feature_flags;" 2>/dev/null || true
        psql postgres -c "CREATE DATABASE feature_flags;"
        echo -e "${GREEN}✓ Database recreated${NC}"
    fi
else
    psql postgres -c "CREATE DATABASE feature_flags;"
    echo -e "${GREEN}✓ Database created${NC}"
fi
echo ""

# Run schema
echo -e "${BLUE}Running database schema...${NC}"
psql feature_flags -f packages/api-feature-flags/schema/feature-flags.sql
echo -e "${GREEN}✓ Schema applied${NC}"
echo ""

# Setup API Server
echo -e "${BLUE}Setting up API Server...${NC}"
cd packages/api-feature-flags

if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo -e "${YELLOW}⚠ Please update .env with your database credentials${NC}"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

echo -e "${BLUE}Installing API dependencies...${NC}"
pnpm install
echo -e "${GREEN}✓ API dependencies installed${NC}"
echo ""

# Setup UI
echo -e "${BLUE}Setting up React UI...${NC}"
cd ../ui-feature-flags

echo -e "${BLUE}Installing UI dependencies...${NC}"
pnpm install
echo -e "${GREEN}✓ UI dependencies installed${NC}"
echo ""

# Back to root
cd ../..

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo -e "1. Start the API server:"
echo -e "   ${YELLOW}cd packages/api-feature-flags && pnpm dev${NC}"
echo ""
echo -e "2. In a new terminal, start the UI:"
echo -e "   ${YELLOW}cd packages/ui-feature-flags && pnpm dev${NC}"
echo ""
echo -e "3. Open your browser to:"
echo -e "   ${YELLOW}http://localhost:3000${NC}"
echo ""
echo -e "API will be available at: ${YELLOW}http://localhost:3001${NC}"
echo ""
echo -e "📚 For more information, see ${YELLOW}FEATURE_FLAGS_SETUP.md${NC}"
