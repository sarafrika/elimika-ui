#!/bin/bash

set -e  # Exit on error

echo "🔑 Setting up SSH key..."
echo "${SERVER_SSH_KEY}" > private_key
chmod 600 private_key

echo "🚀 Setting up server directories..."
ssh -i private_key -o StrictHostKeyChecking=no "${SERVER_SSH_USER}@${SERVER_IP}" <<'EOF'
  set -e  # Exit script on error

  echo "📂 Ensuring deployment directory exists..."
  mkdir -p /home/${SERVER_SSH_USER}/products/elimika-ui/docker
  cd /home/${SERVER_SSH_USER}/products/elimika-ui

  echo "📄 Creating docker-compose.yaml..."
  cat > docker/compose.yaml <<EOC
  version: "3.8"

  services:
    app:
      container_name: elimika-ui
      image: ghcr.io/${GITHUB_REPOSITORY_OWNER}/elimika-ui:latest
      ports:
        - "3000:3000"
      env_file:
        - ../.env.local
      restart: always
EOC

  echo "✅ Server setup complete!"
EOF
