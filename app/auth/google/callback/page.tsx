import { Suspense } from 'react';
import GoogleAuthCallback from '@/components/Pages/GoogleAuthCallback';

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Authenticating...</div>}>
      <GoogleAuthCallback />
    </Suspense>
  );
}
