# Vercel Deployment Guide for NCLEX Frontend

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Backend Deployed**: Your Django backend should be deployed (e.g., on Render)

## Step 1: Prepare Your Repository

1. Make sure your `frontend` folder is the root of your repository or create a separate repository for the frontend
2. Ensure all files are committed and pushed to GitHub

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend` (if your frontend is in a subfolder)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Navigate to your frontend directory:
   ```bash
   cd frontend
   ```

3. Login to Vercel:
   ```bash
   vercel login
   ```

4. Deploy:
   ```bash
   vercel
   ```

## Step 3: Configure Environment Variables

In your Vercel dashboard, go to your project settings and add these environment variables:

### Required Environment Variables

```
NEXT_PUBLIC_API_BASE_URL=https://your-backend-name.onrender.com
NEXT_PUBLIC_BACKEND_URL=https://your-backend-name.onrender.com
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_9afe0ff4d8f81a67b5e799bd12a30551da1b0e19
NEXT_PUBLIC_VIDEO_STREAMING_URL=https://your-backend-name.onrender.com/media/videos
NEXT_PUBLIC_APP_NAME=NCLEX Virtual School
NEXT_PUBLIC_APP_DESCRIPTION=Comprehensive NCLEX preparation platform
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_ENABLE_VIDEO_STREAMING=true
NEXT_PUBLIC_ENABLE_PAYMENT=true
NEXT_PUBLIC_ENABLE_CHAT=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_TWITTER_HANDLE=@nclexkeys
NEXT_PUBLIC_SUPPORT_EMAIL=support@nclexkeys.com
NEXT_PUBLIC_SUPPORT_PHONE=+234-xxx-xxx-xxxx
NODE_ENV=production
```

### Optional Environment Variables

```
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your-google-analytics-id
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=your-facebook-pixel-id
NEXT_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id
NEXT_PUBLIC_CDN_URL=your-cdn-url
```

## Step 4: Update Backend CORS Settings

Make sure your Django backend allows requests from your Vercel domain:

```python
# In your Django settings
CORS_ALLOWED_ORIGINS = [
    "https://your-domain.vercel.app",
    "https://your-project-name.vercel.app",
]
```

## Step 5: Custom Domain (Optional)

1. In Vercel dashboard, go to your project settings
2. Click on "Domains"
3. Add your custom domain
4. Update your DNS settings as instructed by Vercel

## Step 6: Verify Deployment

1. Visit your deployed URL
2. Test key functionality:
   - User registration/login
   - Course browsing
   - Payment integration
   - Video streaming

## Troubleshooting

### Build Errors
- Check that all dependencies are in `package.json`
- Ensure Node.js version compatibility
- Check for TypeScript errors

### API Connection Issues
- Verify `NEXT_PUBLIC_API_BASE_URL` is correct
- Check CORS settings on backend
- Ensure backend is accessible from Vercel

### Payment Issues
- Verify Paystack public key is correct
- Check that webhook URLs are updated to point to your backend

## Performance Optimization

1. **Image Optimization**: Vercel automatically optimizes images
2. **Caching**: Configure appropriate cache headers
3. **CDN**: Vercel provides global CDN automatically
4. **Bundle Analysis**: Use `@next/bundle-analyzer` to optimize bundle size

## Monitoring

1. **Vercel Analytics**: Enable in project settings
2. **Error Tracking**: Consider adding Sentry or similar
3. **Performance Monitoring**: Use Vercel's built-in monitoring

## Security Considerations

1. **Environment Variables**: Never commit sensitive keys to repository
2. **HTTPS**: Vercel provides HTTPS by default
3. **Headers**: Security headers are configured in `vercel.json`
4. **API Keys**: Use environment variables for all sensitive data

## Continuous Deployment

Once set up, Vercel will automatically deploy when you push to your main branch. You can also set up preview deployments for pull requests.

## Support

- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Next.js Documentation: [nextjs.org/docs](https://nextjs.org/docs)
- NCLEX Platform Support: support@nclexkeys.com
