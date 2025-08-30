#!/bin/bash

# Codeforces Clone Setup Script
echo "🚀 Setting up Codeforces Clone development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js >= 18.0.0"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
if [[ "$(printf '%s\n' "18.0.0" "$NODE_VERSION" | sort -V | head -n1)" != "18.0.0" ]]; then
    print_error "Node.js version $NODE_VERSION is not supported. Please install Node.js >= 18.0.0"
    exit 1
fi

print_status "Node.js version $NODE_VERSION detected ✓"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_warning "Docker is not installed. Docker is required for the judge system."
    print_warning "Please install Docker from https://docs.docker.com/get-docker/"
else
    print_status "Docker detected ✓"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_warning "Docker Compose is not installed. Docker Compose is required for easy development setup."
    print_warning "Please install Docker Compose from https://docs.docker.com/compose/install/"
else
    print_status "Docker Compose detected ✓"
fi

# Install root dependencies
print_status "Installing root dependencies..."
npm install

# Install backend dependencies
print_status "Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
print_status "Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Copy environment files
print_status "Setting up environment files..."
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    print_status "Created backend/.env from template"
    print_warning "Please edit backend/.env with your database credentials"
else
    print_warning "backend/.env already exists, skipping copy"
fi

if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    print_status "Created frontend/.env from template"
else
    print_warning "frontend/.env already exists, skipping copy"
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p backend/logs
mkdir -p backend/uploads
mkdir -p backend/temp

# Set up database (if PostgreSQL is available)
if command -v psql &> /dev/null; then
    print_status "PostgreSQL detected. Do you want to create the database? (y/n)"
    read -r CREATE_DB
    if [[ $CREATE_DB == "y" || $CREATE_DB == "Y" ]]; then
        print_status "Creating database..."
        # Note: This assumes local PostgreSQL with current user having privileges
        createdb codeforces_clone 2>/dev/null || print_warning "Database might already exist or insufficient privileges"
    fi
else
    print_warning "PostgreSQL not detected. Please ensure PostgreSQL is installed and running."
fi

# Build judge Docker image (if Docker is available)
if command -v docker &> /dev/null; then
    print_status "Building judge Docker image..."
    cd backend/judge/docker
    if [ -f Dockerfile.judge ]; then
        docker build -f Dockerfile.judge -t judge-runner:latest . || print_warning "Failed to build judge image"
    else
        print_warning "Judge Dockerfile not found"
    fi
    cd ../../..
fi

print_status "🎉 Setup completed!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your database credentials"
echo "2. Start the services:"
echo "   - For development: npm run dev"
echo "   - With Docker: npm run docker:up"
echo "3. Visit http://localhost:3000 to see the application"
echo ""
echo "For more information, see README.md"
