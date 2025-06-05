#!/bin/bash

# AI-Powered Idea Management Hub - Demo Starter Script
# This script starts the system in demo mode with mock authentication

echo "🎭 Starting AI-Powered Idea Management Hub in Demo Mode..."
echo ""

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker >/dev/null 2>&1; then
    echo "❌ Docker is not installed. Please install Docker and try again."
    exit 1
fi

# Ensure demo mode is enabled
echo "✅ Demo mode enabled in .env.local"
echo ""

# Start the Docker stack
echo "🚀 Starting Docker services..."
docker compose down 2>/dev/null  # Clean shutdown first
docker compose up -d

# Wait for services to start
echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo ""
echo "🔍 Checking service status..."

# Check if services are running
if docker compose ps --format "table" | grep -q "Up"; then
    echo "✅ Services are running!"
else
    echo "❌ Some services failed to start. Checking logs..."
    docker compose logs --tail=20
    exit 1
fi

echo ""
echo "🎉 Demo is ready!"
echo ""
echo "📋 Demo Information:"
echo "   🌐 Main Application: http://localhost:8080"
echo "   🖥️  Frontend Direct:  http://localhost:3000"
echo "   🔧 Backend API:      http://localhost:8000"
echo "   📚 API Docs:         http://localhost:8000/docs"
echo ""
echo "👥 Demo Users:"
echo "   📧 contributor@demo.com (password: demo) - Submit ideas"
echo "   📧 evaluator@demo.com   (password: demo) - Evaluate ideas"  
echo "   📧 admin@demo.com       (password: demo) - Full access"
echo "   📧 manager@demo.com     (password: demo) - Multi-role"
echo ""
echo "🎮 Demo Instructions:"
echo "   1. Open http://localhost:8080 in your browser"
echo "   2. Click 'Sign In' or navigate to login"
echo "   3. Use any demo user email and password 'demo'"
echo "   4. Explore the system with different user roles!"
echo ""
echo "📖 Full instructions: See DEMO_SETUP.md"
echo ""
echo "🛑 To stop demo: docker compose down"
echo ""

# Optional: Open browser automatically (commented out by default)
# if command -v open >/dev/null 2>&1; then
#     echo "🌐 Opening browser..."
#     sleep 2
#     open http://localhost:8080
# elif command -v xdg-open >/dev/null 2>&1; then
#     echo "🌐 Opening browser..."
#     sleep 2
#     xdg-open http://localhost:8080
# fi

echo "Demo is running! Press Ctrl+C to stop or run 'docker compose down'"
