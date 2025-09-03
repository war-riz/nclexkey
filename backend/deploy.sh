#!/bin/bash

# NCLEX Website Deployment Script
# Usage: ./deploy.sh [production|staging]

set -e  # Exit on any error

ENVIRONMENT=${1:-production}
PROJECT_DIR="/var/www/nclex"
VENV_DIR="$PROJECT_DIR/venv"
BACKUP_DIR="$PROJECT_DIR/backups"

echo "🚀 Starting deployment for $ENVIRONMENT environment..."

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root"
   exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup current database
echo "📦 Creating database backup..."
if command -v pg_dump &> /dev/null; then
    BACKUP_FILE="$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql"
    pg_dump nclex_production > "$BACKUP_FILE"
    echo "✅ Database backup created: $BACKUP_FILE"
else
    echo "⚠️  pg_dump not found, skipping database backup"
fi

# Stop services
echo "🛑 Stopping services..."
sudo systemctl stop nclex || true
sudo systemctl stop nginx || true

# Navigate to project directory
cd "$PROJECT_DIR"

# Activate virtual environment
echo "🐍 Activating virtual environment..."
source "$VENV_DIR/bin/activate"

# Pull latest changes (if using git)
if [ -d ".git" ]; then
    echo "📥 Pulling latest changes..."
    git pull origin main || echo "⚠️  Git pull failed, continuing with current code"
fi

# Install/update dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.production.txt

# Run database migrations
echo "🗄️  Running database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --clear

# Create logs directory
mkdir -p logs

# Set proper permissions
echo "🔐 Setting permissions..."
sudo chown -R www-data:www-data "$PROJECT_DIR"
sudo chmod -R 755 "$PROJECT_DIR"
sudo chmod -R 775 "$PROJECT_DIR/logs"
sudo chmod -R 775 "$PROJECT_DIR/media"

# Start services
echo "▶️  Starting services..."
sudo systemctl start nclex
sudo systemctl start nginx

# Enable services on boot
sudo systemctl enable nclex
sudo systemctl enable nginx

# Check service status
echo "🔍 Checking service status..."
sudo systemctl status nclex --no-pager -l
sudo systemctl status nginx --no-pager -l

# Test application
echo "🧪 Testing application..."
sleep 5
if curl -f http://localhost:8000/admin/ > /dev/null 2>&1; then
    echo "✅ Application is responding"
else
    echo "❌ Application is not responding"
    exit 1
fi

# Health check
echo "🏥 Running health checks..."
if [ -f "health_check.py" ]; then
    python health_check.py
fi

echo "🎉 Deployment completed successfully!"
echo "📊 Monitor logs with: sudo journalctl -u nclex -f"
echo "🌐 Check nginx logs: sudo tail -f /var/log/nginx/access.log"
echo "📁 Backup location: $BACKUP_DIR"
