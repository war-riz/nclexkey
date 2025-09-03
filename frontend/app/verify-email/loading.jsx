import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, Mail } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Email Verification
            </h1>
            <p className="text-gray-600 text-sm">
              Loading verification page...
            </p>
          </CardHeader>
          
          <CardContent className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Please wait...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




