#!/bin/bash

set -e  # Exit on error

IMAGE_NAME="ghcr.io/${GITHUB_REPOSITORY_OWNER}/elimika-ui"

echo "🚀 Building Docker Image..."
docker build -t "$IMAGE_NAME:latest" -f docker/Dockerfile .

echo "📤 Pushing Docker Image..."
docker push "$IMAGE_NAME:latest"

echo "✅ Docker Image Build & Push complete!"
