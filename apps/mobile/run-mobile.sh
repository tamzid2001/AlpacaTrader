#!/bin/bash

# Run Expo mobile app
echo "Starting Expo mobile app..."
cd apps/mobile

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start Expo
echo "Starting Expo..."
npm start