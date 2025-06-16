#!/bin/bash
set -e

# MagLabs Unified Deployment Script
# Handles both local and EC2 deployment with automatic environment detection

echo "🚀 MagLabs Deployment Script"
echo "============================"

# Configuration
DEFAULT_EC2_IP="3.108.58.153"
GITHUB_REPO="gaju-magure/maglabs-deployment"
SSH_KEY_PATH="${SSH_KEY_PATH:-./maglasb-app-ssh.pem}"

# Function to generate secure secret key
generate_secret_key() {
    openssl rand -base64 60 | tr -d "=+/\n\r" | cut -c1-50
}

# Function to detect deployment environment
detect_environment() {
    if [ -n "$EC2_IP" ] || [ "$1" = "ec2" ]; then
        echo "ec2"
    else
        echo "local"
    fi
}

# Function to setup local environment
setup_local() {
    echo "🏠 Setting up local environment..."
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        cat > .env << EOF
# Database Configuration
POSTGRES_DB=maglabs
POSTGRES_USER=maglabs
POSTGRES_PASSWORD=maglabs123
POSTGRES_PORT=5432

# Django Configuration
DJANGO_SETTINGS_MODULE=config.settings.dev
DEBUG=true
SECRET_KEY=$(generate_secret_key)
ALLOWED_HOSTS=localhost,127.0.0.1,backend
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://frontend:3000

# MagLabs API Configuration
MAGLABS_API_URL=http://localhost:8001
MAGLABS_API_KEY=dev-api-key

# Docker Configuration
TARGET=development
EOF
        echo "✅ Created .env file"
    fi
    
    # Build and start services
    echo "🔨 Building and starting services..."
    docker-compose down -v 2>/dev/null || true
    docker-compose build --no-cache
    docker-compose up -d
    
    # Wait for services to be ready
    echo "⏳ Waiting for services to start..."
    sleep 30
    
    # Run bootstrap
    echo "🌱 Running bootstrap..."
    docker-compose exec backend python bootstrap.py
    
    echo "✅ Local deployment completed!"
    echo "🌐 Access your application:"
    echo "   Main: http://localhost"
    echo "   Admin: http://admin.localhost/admin/"
    echo "   Demo: http://demo.localhost/"
}

# Function to setup EC2 environment
setup_ec2() {
    local ec2_ip="${EC2_IP:-$DEFAULT_EC2_IP}"
    
    echo "☁️ Setting up EC2 environment ($ec2_ip)..."
    
    # Check SSH key
    if [ ! -f "$SSH_KEY_PATH" ]; then
        echo "❌ SSH key not found at $SSH_KEY_PATH"
        echo "Please ensure your SSH key is available"
        exit 1
    fi
    
    # Create EC2 environment file
    cat > .env.ec2 << EOF
# Database Configuration
POSTGRES_DB=maglabs_prod
POSTGRES_USER=maglabs_user
POSTGRES_PASSWORD=$(generate_secret_key)
POSTGRES_PORT=5432

# Django Configuration
DJANGO_SETTINGS_MODULE=config.settings.prod
DEBUG=false
SECRET_KEY=$(generate_secret_key)
ALLOWED_HOSTS=$ec2_ip,admin.$ec2_ip,demo.$ec2_ip
CORS_ALLOWED_ORIGINS=http://$ec2_ip,http://admin.$ec2_ip,http://demo.$ec2_ip

# MagLabs API Configuration
MAGLABS_API_URL=http://localhost:8001
MAGLABS_API_KEY=$(generate_secret_key)

# Docker Configuration
TARGET=production
DOMAIN_NAME=$ec2_ip
EOF
    
    echo "✅ Created .env.ec2 file"
    
    # Deploy to EC2
    echo "🚀 Deploying to EC2..."
    
    # Copy files to EC2
    rsync -avz --exclude='.git' --exclude='node_modules' --exclude='__pycache__' \
          -e "ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no" \
          . ubuntu@$ec2_ip:/home/ubuntu/maglabs/
    
    # Execute deployment on EC2
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no ubuntu@$ec2_ip << 'ENDSSH'
cd /home/ubuntu/maglabs

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    sudo apt-get update
    sudo apt-get install -y docker.io docker-compose
    sudo usermod -aG docker ubuntu
    sudo systemctl start docker
    sudo systemctl enable docker
fi

# Copy environment file
cp .env.ec2 .env

# Stop existing services
sudo docker-compose down -v 2>/dev/null || true

# Build and start services
sudo docker-compose build --no-cache
sudo docker-compose up -d

# Wait for services
sleep 60

# Run bootstrap
sudo docker-compose exec -T backend python bootstrap.py

echo "✅ EC2 deployment completed!"
ENDSSH
    
    echo "🌐 Access your application:"
    echo "   Main: http://$ec2_ip"
    echo "   Admin: http://admin.$ec2_ip/admin/"
    echo "   Demo: http://demo.$ec2_ip/"
}

# Function to show help
show_help() {
    cat << EOF
MagLabs Deployment Script

Usage: $0 [COMMAND]

Commands:
  local     Deploy locally using Docker Compose
  ec2       Deploy to EC2 instance
  help      Show this help message

Environment Variables:
  EC2_IP    EC2 instance IP address (default: $DEFAULT_EC2_IP)

Examples:
  $0 local              # Deploy locally
  $0 ec2                # Deploy to default EC2
  EC2_IP=1.2.3.4 $0 ec2 # Deploy to specific EC2

EOF
}

# Main execution
case "${1:-local}" in
    local)
        setup_local
        ;;
    ec2)
        setup_ec2
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "❌ Unknown command: $1"
        show_help
        exit 1
        ;;
esac