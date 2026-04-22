#!/bin/bash

# Build script for Render deployment

# Exit if any command fails
set -e

# Install dependencies
npm install

# Build the application
npm run build

# Running tests (if any)
npm test

# Deployment command (if applicable)
# render deploy

echo "Build completed successfully!"