#!/bin/bash

set -e

# Function to install and start service if not present
install_and_start() {
    local check_cmd=$1
    local package=$2
    local service=$3

    if ! command -v "$check_cmd" > /dev/null 2>&1; then
        echo "Installing $package..."
        sudo apt update
        sudo apt install -y "$package"
    fi

    echo "Starting $service..."
    sudo service "$service" start
}

# Install and start PostgreSQL
install_and_start psql "postgresql postgresql-contrib" "postgresql"

# Install and start Redis
install_and_start redis-cli "redis-server" "redis-server"

echo "PostgreSQL and Redis services have been started successfully."
