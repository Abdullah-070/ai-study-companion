import { Suspense } from 'react';
import OAuthCallbackContent from './oauth-callback-content';

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<OAuthLoadingFallback />}>
      <OAuthCallbackContent />
    </Suspense>
  );
}

function OAuthLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-600">Authenticating...</div>
    </div>
  );
}
