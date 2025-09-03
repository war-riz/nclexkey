# 🚀 Production Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. **Environment Variables**
Create a `.env.production` file with production values:

```bash
# Django Settings
DEBUG=False
SECRET_KEY=your-super-secure-production-secret-key
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,api.yourdomain.com

# Database (PostgreSQL recommended for production)
DATABASE_URL=postgresql://username:password@host:port/database_name

# Email (Use production SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@domain.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=NCLEX <noreply@yourdomain.com>

# Payment Gateway (Production Keys)
PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_WEBHOOK_SECRET=your_production_webhook_secret

# Frontend URL
FRONTEND_URL=https://yourdomain.com
SITE_URL=https://api.yourdomain.com

# Security
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
SECURE_CONTENT_TYPE_NOSNIFF=True
SECURE_BROWSER_XSS_FILTER=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

### 2. **Database Migration**
```bash
python manage.py migrate
python manage.py collectstatic
```

### 3. **Create Production Superuser**
```bash
python manage.py createsuperuser
```

### 4. **Payment Gateway Setup**
- Update Paystack to production mode
- Set webhook URLs to production endpoints
- Test payment flow in production

## 🌐 **Deployment Options**

### Option A: VPS/Cloud Server (Recommended)
- **Platforms**: DigitalOcean, AWS EC2, Google Cloud, Azure
- **Requirements**: Ubuntu 20.04+, 2GB RAM, 20GB SSD
- **Services**: Nginx, Gunicorn, PostgreSQL, Redis

### Option B: Platform as a Service
- **Platforms**: Heroku, Railway, Render, DigitalOcean App Platform
- **Pros**: Easy deployment, managed services
- **Cons**: Higher cost, less control

### Option C: Shared Hosting
- **Platforms**: Hostinger, Bluehost, SiteGround
- **Pros**: Low cost, easy setup
- **Cons**: Limited features, shared resources

## 🛠️ **Server Setup (Option A)**

### 1. **Server Preparation**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install python3 python3-pip python3-venv nginx postgresql postgresql-contrib redis-server -y

# Create project directory
sudo mkdir -p /var/www/nclex
sudo chown $USER:$USER /var/www/nclex
```

### 2. **Python Environment**
```bash
cd /var/www/nclex
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. **PostgreSQL Setup**
```bash
sudo -u postgres psql
CREATE DATABASE nclex_production;
CREATE USER nclex_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE nclex_production TO nclex_user;
\q
```

### 4. **Nginx Configuration**
```nginx
# /etc/nginx/sites-available/nclex
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /static/ {
        alias /var/www/nclex/staticfiles/;
    }
    
    location /media/ {
        alias /var/www/nclex/media/;
    }
}
```

### 5. **Gunicorn Service**
```bash
# /etc/systemd/system/nclex.service
[Unit]
Description=NCLEX Gunicorn daemon
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/nclex
Environment="PATH=/var/www/nclex/venv/bin"
ExecStart=/var/www/nclex/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 config.wsgi:application

[Install]
WantedBy=multi-user.target
```

### 6. **Start Services**
```bash
sudo systemctl start nclex
sudo systemctl enable nclex
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 🔒 **Security Checklist**

- [ ] Change DEBUG to False
- [ ] Generate new SECRET_KEY
- [ ] Set ALLOWED_HOSTS
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set secure cookie settings
- [ ] Enable HSTS
- [ ] Configure firewall (UFW)
- [ ] Regular security updates
- [ ] Database backup strategy

## 📊 **Monitoring & Maintenance**

### 1. **Logs**
```bash
# Django logs
sudo journalctl -u nclex -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 2. **Backup Script**
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump nclex_production > backup_$DATE.sql
tar -czf backup_$DATE.tar.gz backup_$DATE.sql
rm backup_$DATE.sql
```

### 3. **Health Check Endpoint**
```python
# Add to your views
@api_view(['GET'])
def health_check(request):
    return Response({'status': 'healthy', 'timestamp': timezone.now()})
```

## 🚨 **Emergency Procedures**

### 1. **Rollback**
```bash
# Stop services
sudo systemctl stop nclex nginx

# Restore from backup
psql nclex_production < backup_file.sql

# Restart services
sudo systemctl start nclex nginx
```

### 2. **Database Issues**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart database
sudo systemctl restart postgresql
```

## 📞 **Support & Contact**

- **Documentation**: Check Django docs for deployment
- **Community**: Django forums, Stack Overflow
- **Monitoring**: Set up alerts for downtime

## ✅ **Post-Deployment Verification**

- [ ] Website loads correctly
- [ ] All API endpoints respond
- [ ] Payment processing works
- [ ] Email notifications sent
- [ ] Database connections stable
- [ ] SSL certificate valid
- [ ] Performance acceptable
- [ ] Monitoring alerts configured

---

**Remember**: Always test in staging environment first!
**Backup**: Regular backups are crucial for production systems.
**Security**: Keep all software updated and monitor for vulnerabilities.
