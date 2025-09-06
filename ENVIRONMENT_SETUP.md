# Environment Setup Guide for NCLEX Keys Platform

## Overview
This guide explains how to set up the environment variables for both backend and frontend to ensure full functionality of the NCLEX Keys platform.

## Backend Environment Setup

### 1. Create Backend Environment File
Copy the production environment template:
```bash
cp backend/env.production backend/.env
```

### 2. Required Environment Variables

#### Database Configuration
- `DB_NAME`: MongoDB database name (nclex)
- `DB_HOST`: MongoDB connection string
- `DB_USER`: MongoDB username
- `DB_PASSWORD`: MongoDB password
- `DB_AUTH_SOURCE`: MongoDB authentication source

#### Security Configuration
- `JWT_SECRET_KEY`: Secret key for JWT token generation
- `SECRET_KEY`: Django secret key
- `ALLOWED_HOSTS`: Comma-separated list of allowed hosts

#### Email Configuration
- `EMAIL_HOST`: SMTP server (smtp.gmail.com)
- `EMAIL_PORT`: SMTP port (587)
- `EMAIL_HOST_USER`: Your email address
- `EMAIL_HOST_PASSWORD`: Your email app password

#### Payment Gateway Configuration
- `PAYSTACK_PUBLIC_KEY`: Paystack public key (pk_live_...)
- `PAYSTACK_SECRET_KEY`: Paystack secret key (sk_live_...)
- `PAYSTACK_WEBHOOK_SECRET`: Paystack webhook secret
- `PAYSTACK_SUBACCOUNT_CODE`: Paystack subaccount code
- `PAYSTACK_SPLIT_CODE`: Paystack split code

#### Cloudinary Configuration (for file uploads)
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret

## Frontend Environment Setup

### 1. Create Frontend Environment File
Copy the production environment template:
```bash
cp frontend/env.local.production frontend/.env.local
```

### 2. Required Environment Variables

#### API Configuration
- `NEXT_PUBLIC_API_BASE_URL`: Backend API URL
- `NEXT_PUBLIC_BACKEND_URL`: Backend URL

#### Payment Configuration
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`: Paystack public key
- `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY`: Flutterwave public key (backup)

#### Application Configuration
- `NEXT_PUBLIC_APP_NAME`: Application name
- `NEXT_PUBLIC_APP_URL`: Frontend URL
- `NEXT_PUBLIC_VIDEO_STREAMING_URL`: Video streaming URL

#### Feature Flags
- `NEXT_PUBLIC_ENABLE_VIDEO_STREAMING`: Enable video streaming
- `NEXT_PUBLIC_ENABLE_PAYMENT`: Enable payment functionality
- `NEXT_PUBLIC_ENABLE_CHAT`: Enable chat functionality
- `NEXT_PUBLIC_ENABLE_NOTIFICATIONS`: Enable notifications

## Production Deployment

### Backend (Render.com)
1. Set environment variables in Render dashboard
2. Use the values from `backend/env.production`
3. Update URLs to match your production domains

### Frontend (Vercel)
1. Set environment variables in Vercel dashboard
2. Use the values from `frontend/env.local.production`
3. Update URLs to match your production domains

## Security Notes

⚠️ **IMPORTANT SECURITY REMINDERS:**
- Never commit `.env` files to version control
- Use strong, unique secret keys in production
- Keep payment gateway credentials secure
- Regularly rotate API keys and secrets
- Use environment-specific configurations

## Verification Checklist

- [ ] Backend `.env` file created with all required variables
- [ ] Frontend `.env.local` file created with all required variables
- [ ] Database connection configured
- [ ] Email service configured
- [ ] Payment gateway credentials set
- [ ] Cloudinary credentials configured (if using file uploads)
- [ ] CORS settings configured for production domains
- [ ] All URLs updated for production environment

## Troubleshooting

### Common Issues:
1. **Database Connection Failed**: Check MongoDB credentials and connection string
2. **Payment Not Working**: Verify Paystack credentials and webhook configuration
3. **Email Not Sending**: Check SMTP credentials and app password
4. **CORS Errors**: Verify ALLOWED_HOSTS and CORS_ALLOWED_ORIGINS settings

### Testing Environment Variables:
```bash
# Backend
cd backend
python manage.py check

# Frontend
cd frontend
npm run build
```

## Support
For additional help with environment setup, contact: support@nclexkeys.com
