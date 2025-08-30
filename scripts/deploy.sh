#!/bin/bash

# Codeforces Clone Deployment Script
echo "🚀 Deploying Codeforces Clone..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

# Deployment type
DEPLOY_TYPE=${1:-"docker"}

case $DEPLOY_TYPE in
    "docker")
        print_header "Deploying with Docker Compose..."

        # Build images
        print_status "Building Docker images..."
        docker-compose -f docker/docker-compose.yml build

        # Stop existing containers
        print_status "Stopping existing containers..."
        docker-compose -f docker/docker-compose.yml down

        # Start services
        print_status "Starting services..."
        docker-compose -f docker/docker-compose.yml up -d

        # Wait for services to be ready
        print_status "Waiting for services to be ready..."
        sleep 30

        # Check if services are running
        if docker-compose -f docker/docker-compose.yml ps | grep -q "Up"; then
            print_status "✅ Deployment successful!"
            echo ""
            echo "Services are running:"
            docker-compose -f docker/docker-compose.yml ps
            echo ""
            echo "Application URLs:"
            echo "  Frontend: http://localhost:3000"
            echo "  Backend API: http://localhost:5000"
            echo "  API Health: http://localhost:5000/health"
        else
            print_error "❌ Deployment failed!"
            echo "Check logs with: docker-compose -f docker/docker-compose.yml logs"
            exit 1
        fi
        ;;

    "k8s"|"kubernetes")
        print_header "Deploying to Kubernetes..."

        # Check if kubectl is available
        if ! command -v kubectl &> /dev/null; then
            print_error "kubectl is not installed or not in PATH"
            exit 1
        fi

        # Check if cluster is accessible
        if ! kubectl cluster-info &> /dev/null; then
            print_error "Cannot connect to Kubernetes cluster"
            exit 1
        fi

        # Apply configurations
        print_status "Applying Kubernetes configurations..."
        kubectl apply -f kubernetes/

        # Wait for deployments
        print_status "Waiting for deployments to be ready..."
        kubectl wait --for=condition=available --timeout=300s deployment --all

        # Show status
        print_status "✅ Kubernetes deployment successful!"
        echo ""
        echo "Deployment status:"
        kubectl get deployments
        echo ""
        echo "Services:"
        kubectl get services
        echo ""
        echo "To access the application:"
        echo "  kubectl port-forward service/frontend-service 3000:80"
        echo "  kubectl port-forward service/backend-service 5000:5000"
        ;;

    "local")
        print_header "Deploying for local development..."

        # Install dependencies
        print_status "Installing dependencies..."
        npm install
        cd frontend && npm install && cd ..
        cd backend && npm install && cd ..

        # Build frontend
        print_status "Building frontend..."
        cd frontend && npm run build && cd ..

        # Start backend
        print_status "Starting backend server..."
        cd backend && npm start &
        BACKEND_PID=$!
        cd ..

        print_status "✅ Local deployment started!"
        echo ""
        echo "Backend PID: $BACKEND_PID"
        echo "Application URL: http://localhost:5000"
        echo ""
        echo "To stop the backend:"
        echo "  kill $BACKEND_PID"
        ;;

    *)
        print_error "Unknown deployment type: $DEPLOY_TYPE"
        echo ""
        echo "Usage: $0 [docker|k8s|local]"
        echo ""
        echo "Deployment types:"
        echo "  docker    - Deploy using Docker Compose (default)"
        echo "  k8s       - Deploy to Kubernetes cluster"
        echo "  local     - Deploy for local development"
        exit 1
        ;;
esac

print_status "🎉 Deployment completed!"
