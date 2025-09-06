#!/bin/bash

# Production Deployment Script for NCLEX Keys Platform
# This script sets up the production environment

echo "🚀 Starting Production Deployment..."

# Set production environment
export DJANGO_SETTINGS_MODULE=config.settings_production

# Install production dependencies
echo "📦 Installing production dependencies..."
pip install -r requirements.production.txt

# Run database migrations
echo "🗄️ Running database migrations..."
python manage.py migrate --settings=config.settings_production

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --settings=config.settings_production

# Create superuser (if needed)
echo "👤 Creating superuser..."
python manage.py createsuperuser --settings=config.settings_production

# Set up log directories
echo "📝 Setting up logging..."
mkdir -p log
chmod 755 log

# Set proper permissions
echo "🔒 Setting file permissions..."
chmod 644 *.py
chmod 755 manage.py
chmod 755 deploy_production.sh

# Create systemd service file
echo "⚙️ Creating systemd service..."
cat > /etc/systemd/system/nclex-keys.service << EOF
[Unit]
Description=NCLEX Keys Django Application
After=network.target

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=$(pwd)
Environment=DJANGO_SETTINGS_MODULE=config.settings_production
ExecStart=/usr/bin/python3 manage.py runserver 0.0.0.0:8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
echo "🔄 Enabling service..."
systemctl daemon-reload
systemctl enable nclex-keys
systemctl start nclex-keys

# Check service status
echo "✅ Checking service status..."
systemctl status nclex-keys --no-pager

echo "🎉 Production deployment completed!"
echo "📊 Service status: systemctl status nclex-keys"
echo "📝 Logs: journalctl -u nclex-keys -f"
echo "🔄 Restart: systemctl restart nclex-keys"
