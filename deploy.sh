#!/bin/bash

# Server Monitoring Dashboard - Deployment Script
# This script helps deploy the application to your local server

echo "🚀 Starting deployment of Server Monitoring Dashboard..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Copy production package.json
if [ -f "package-production.json" ]; then
    echo "📦 Setting up production configuration..."
    cp package-production.json package.json
else
    echo "❌ package-production.json not found!"
    exit 1
fi

# Install dependencies
echo "📥 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Build the application
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed successfully!"
echo ""
echo "🎉 Deployment complete!"
echo ""
echo "To start the server:"
echo "  npm start"
echo ""
echo "The application will be available at:"
echo "  http://localhost:5000"
echo "  http://$(hostname -I | awk '{print $1}'):5000"
echo ""
echo "To run on a different port:"
echo "  PORT=3000 npm start"
echo ""
echo "Press Ctrl+C to stop the server when running."