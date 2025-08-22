# NCLEX Frontend Setup Guide

This guide will help you set up the NCLEX frontend with video streaming and Nigerian payment integration.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend server running (see backend setup guide)

### 1. Install Dependencies

```bash
# Install all dependencies
npm install

# Or using yarn
yarn install
```

### 2. Environment Configuration

Create a `.env.local` file in the frontend root directory:

```env
# Backend API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Payment Gateway Configuration (Paystack)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key_here
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_your_flutterwave_public_key_here

# Video Streaming Configuration
NEXT_PUBLIC_VIDEO_STREAMING_URL=http://localhost:8000/media/videos
NEXT_PUBLIC_CDN_URL=

# Application Configuration
NEXT_PUBLIC_APP_NAME=NCLEX Virtual School
NEXT_PUBLIC_APP_DESCRIPTION=Comprehensive NCLEX preparation platform
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_ENABLE_VIDEO_STREAMING=true
NEXT_PUBLIC_ENABLE_PAYMENT=true
NEXT_PUBLIC_ENABLE_CHAT=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
```

### 3. Start Development Server

```bash
npm run dev
# Or
yarn dev
```

The frontend will be available at `http://localhost:3000`

## 🎥 Video Streaming Features

### Video Player Component

The platform includes a comprehensive video player with:

- **HLS Streaming**: HTTP Live Streaming for adaptive bitrate
- **Multiple Quality Levels**: 360p, 480p, 720p, 1080p
- **Custom Controls**: Play, pause, seek, volume, fullscreen
- **Progress Tracking**: Automatic progress saving
- **Error Handling**: Graceful error handling and retry

### Usage

```jsx
import VideoPlayer from '@/components/video-player'

function LessonPage({ lesson }) {
  const handleProgress = (currentTime, duration) => {
    // Save progress to backend
    console.log(`Progress: ${currentTime}/${duration}`)
  }

  const handleComplete = () => {
    // Mark lesson as completed
    console.log('Lesson completed!')
  }

  return (
    <VideoPlayer
      videoId={lesson.video_id}
      title={lesson.title}
      onProgress={handleProgress}
      onComplete={handleComplete}
      autoPlay={false}
    />
  )
}
```

### Video API Functions

```javascript
import { videoAPI } from '@/lib/api'

// Get HLS stream URL
const streamUrl = videoAPI.getVideoStream('video-id', '720p')

// Get DASH manifest URL
const manifestUrl = videoAPI.getVideoManifest('video-id')

// Get video thumbnail
const thumbnailUrl = videoAPI.getVideoThumbnail('video-id')

// Get video segments
const segmentUrl = videoAPI.getVideoSegments('video-id', 1)
```

## 💳 Nigerian Payment Integration

### Payment Form Component

The platform includes a comprehensive Nigerian payment form with:

- **Card Payments**: Visa, Mastercard, Verve
- **Bank Transfers**: Direct bank transfers
- **USSD Payments**: USSD codes for major Nigerian banks
- **Mobile Money**: OPay, PalmPay, Kuda Bank
- **Account Verification**: Real-time bank account verification

### Usage

```jsx
import NigerianBankPaymentForm from '@/components/nigerian-bank-payment-form'

function CourseEnrollmentPage({ course }) {
  const handlePaymentSuccess = (paymentData) => {
    // Handle successful payment
    console.log('Payment successful:', paymentData)
  }

  const handlePaymentError = (error) => {
    // Handle payment error
    console.error('Payment failed:', error)
  }

  return (
    <NigerianBankPaymentForm
      course={course}
      amount={course.price}
      onSuccess={handlePaymentSuccess}
      onError={handlePaymentError}
    />
  )
}
```

### Nigerian Bank API Functions

```javascript
import { nigerianBankAPI } from '@/lib/api'

// Get Nigerian banks
const banks = await nigerianBankAPI.getBanks()

// Verify bank account
const account = await nigerianBankAPI.verifyBankAccount('1234567890', '044')

// Get payment channels
const channels = await nigerianBankAPI.getPaymentChannels()

// Get USSD codes
const ussdCodes = await nigerianBankAPI.getUssdCodes()

// Get mobile money providers
const mobileMoney = await nigerianBankAPI.getMobileMoneyProviders()

// Get transfer instructions
const instructions = await nigerianBankAPI.getTransferInstructions('044', 50000)
```

## 🏦 Supported Nigerian Banks

### Major Banks
- Access Bank (044)
- First Bank (011)
- GT Bank (058)
- UBA (033)
- Zenith Bank (057)
- Ecobank (050)
- Fidelity Bank (070)
- Stanbic IBTC (221)
- Union Bank (032)
- Wema Bank (035)

### Digital Banks
- Kuda Bank (50211)
- ALAT by Wema (035A)
- Rubies Bank (125)

### Mobile Money
- OPay (100)
- PalmPay (999991)
- Sparkle Microfinance (51310)
- FairMoney Microfinance (51318)

## 🔧 Configuration Options

### Video Streaming Settings

```javascript
// In your component
const videoConfig = {
  quality: '720p', // 360p, 480p, 720p, 1080p
  autoPlay: false,
  showControls: true,
  onProgress: (currentTime, duration) => {
    // Handle progress updates
  },
  onComplete: () => {
    // Handle video completion
  }
}
```

### Payment Settings

```javascript
// Payment configuration
const paymentConfig = {
  paystack: {
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    currency: 'NGN',
    country: 'NG',
  },
  flutterwave: {
    publicKey: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
    currency: 'NGN',
    country: 'NG',
  }
}
```

## 🧪 Testing

### Test Payment Integration

1. **Use Test Keys**: Use Paystack test keys for development
2. **Test Cards**: Use Nigerian test cards
3. **Test Bank Accounts**: Use test bank account numbers
4. **Webhook Testing**: Test webhook endpoints

### Test Video Streaming

1. **Upload Test Videos**: Upload test videos to backend
2. **Check HLS Support**: Verify HLS.js is working
3. **Test Quality Switching**: Test different quality levels
4. **Test Progress Tracking**: Verify progress is saved

### Run Tests

```bash
# Run all tests
npm test

# Run specific tests
npm test -- --testPathPattern=video
npm test -- --testPathPattern=payment

# Run with coverage
npm run test:coverage
```

## 🚀 Production Deployment

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Variables for Production

```env
# Production settings
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_your_live_key
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_your_live_key
NEXT_PUBLIC_VIDEO_STREAMING_URL=https://your-cdn-domain.com/videos
NEXT_PUBLIC_CDN_URL=https://your-cdn-domain.com
```

### Deployment Platforms

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Netlify
```bash
# Build
npm run build

# Deploy to Netlify
# Upload the 'out' directory to Netlify
```

#### AWS Amplify
```bash
# Connect your repository to AWS Amplify
# Amplify will automatically build and deploy
```

## 📱 Mobile Responsiveness

The platform is fully responsive and works on:

- **Desktop**: Full feature set
- **Tablet**: Optimized layout
- **Mobile**: Touch-friendly interface
- **PWA**: Progressive Web App support

## 🔒 Security Features

### Payment Security
- **PCI Compliance**: Paystack handles PCI compliance
- **Tokenization**: Card details are tokenized
- **Encryption**: All data is encrypted in transit
- **Webhook Verification**: Secure webhook verification

### Video Security
- **Signed URLs**: Video URLs are signed
- **Access Control**: Videos are protected by authentication
- **Watermarking**: Optional video watermarking
- **Download Prevention**: Offline downloads disabled

## 🆘 Troubleshooting

### Common Issues

1. **Video Not Loading**
   - Check FFmpeg installation on backend
   - Verify video file format
   - Check network connectivity

2. **Payment Failed**
   - Verify API keys
   - Check webhook URLs
   - Test with sandbox keys first

3. **HLS Not Working**
   - Install HLS.js: `npm install hls.js`
   - Check browser compatibility
   - Verify video stream URL

4. **Bank Verification Failed**
   - Check bank code format
   - Verify account number length
   - Test with valid test accounts

### Debug Mode

Enable debug mode in development:

```javascript
// In your component
const debug = process.env.NODE_ENV === 'development'

if (debug) {
  console.log('Payment config:', paymentConfig)
  console.log('Video URL:', videoUrl)
}
```

## 📚 API Documentation

### Authentication

All API calls require authentication:

```javascript
// Login to get token
const loginResult = await login({ email, password })

// Token is automatically included in API calls
localStorage.setItem('access_token', loginResult.data.access)
```

### Error Handling

```javascript
try {
  const result = await paymentAPI.initializePayment(courseId, 'paystack')
  
  if (result.success) {
    // Handle success
  } else {
    // Handle error
    console.error(result.error.message)
  }
} catch (error) {
  // Handle network error
  console.error('Network error:', error)
}
```

## 🤝 Support

For additional support:

- Check the browser console for errors
- Review network requests in DevTools
- Check backend logs
- Contact the development team

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.




