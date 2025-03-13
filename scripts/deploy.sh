#!/bin/bash

set -e  # Exit on error

echo "🔑 Setting up SSH key..."
echo "${SERVER_SSH_KEY}" > private_key
chmod 600 private_key

echo "🚀 Connecting to server and deploying..."
ssh -i private_key -o StrictHostKeyChecking=no "${SERVER_SSH_USER}@${SERVER_IP}" <<'EOF'
  set -e  # Exit script on error

  echo "🔑 Logging in to GitHub Container Registry..."
  echo "${GHCR_PAT}" | docker login ghcr.io -u "${GITHUB_ACTOR}" --password-stdin

  echo "🚀 Pulling latest Docker image..."
  cd /home/${SERVER_SSH_USER}/products/elimika-ui/docker
  docker compose -f compose.yaml pull

  echo "🚀 Restarting the application..."
  docker compose -f compose.yaml up -d --no-deps --build

  echo "🧹 Cleaning up old Docker images..."
  docker system prune -af

  echo "✅ Deployment complete!"
EOF
