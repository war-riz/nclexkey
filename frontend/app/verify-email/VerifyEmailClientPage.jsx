'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react';

export default function VerifyEmailClientPage() {
  const [verificationStatus, setVerificationStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setVerificationStatus('error');
        setMessage('No verification token found. Please check your email for the correct verification link.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/verify-email/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setVerificationStatus('success');
          setMessage(data.message || 'Email verified successfully!');
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        } else {
          setVerificationStatus('error');
          setMessage(data.detail || 'Verification failed. Please try again.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setVerificationStatus('error');
        setMessage('An error occurred during verification. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  const handleResendVerification = async () => {
    router.push('/resend-verification');
  };

  const handleGoToLogin = () => {
    router.push('/login');
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold mb-2">Verifying your email...</h2>
          <p className="text-gray-600">Please wait while we verify your email address.</p>
        </div>
      );
    }

    if (verificationStatus === 'success') {
      return (
        <div className="text-center">
          <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-600" />
          <h2 className="text-2xl font-bold mb-2 text-green-800">Email Verified!</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Redirecting to login page in 3 seconds...
            </p>
            <Button onClick={handleGoToLogin} className="w-full">
              Go to Login <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    if (verificationStatus === 'error') {
      return (
        <div className="text-center">
          <XCircle className="h-16 w-16 mx-auto mb-4 text-red-600" />
          <h2 className="text-2xl font-bold mb-2 text-red-800">Verification Failed</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="space-y-3">
            <Button onClick={handleResendVerification} variant="outline" className="w-full">
              <Mail className="mr-2 h-4 w-4" />
              Resend Verification Email
            </Button>
            <Button onClick={handleGoToLogin} className="w-full">
              Go to Login <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Email Verification
            </CardTitle>
            <p className="text-gray-600 text-sm">
              We're verifying your email address to complete your registration.
            </p>
          </CardHeader>
          
          <CardContent className="pt-0">
            {renderContent()}
          </CardContent>
        </Card>

        {/* Additional Help Section */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help?{' '}
            <a 
              href="mailto:support@nclexvirtualschool.com" 
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
