@echo off
REM NCLEX Frontend Vercel Deployment Script for Windows
REM This script helps prepare and deploy the frontend to Vercel

echo 🚀 NCLEX Frontend Vercel Deployment Script
echo ==========================================

REM Check if we're in the frontend directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the frontend directory
    pause
    exit /b 1
)

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if errorlevel 1 (
    echo 📦 Installing Vercel CLI...
    npm install -g vercel
)

REM Check if user is logged in to Vercel
vercel whoami >nul 2>&1
if errorlevel 1 (
    echo 🔐 Please login to Vercel:
    vercel login
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Build the project to check for errors
echo 🔨 Building project...
npm run build

if errorlevel 1 (
    echo ❌ Build failed. Please fix the errors before deploying.
    pause
    exit /b 1
)

echo ✅ Build successful!

REM Deploy to Vercel
echo 🚀 Deploying to Vercel...
vercel --prod

echo ✅ Deployment complete!
echo.
echo 📋 Next steps:
echo 1. Go to your Vercel dashboard
echo 2. Add environment variables (see VERCEL_DEPLOYMENT_GUIDE.md)
echo 3. Update your backend CORS settings
echo 4. Test your deployed application
echo.
echo 📖 For detailed instructions, see VERCEL_DEPLOYMENT_GUIDE.md
pause
