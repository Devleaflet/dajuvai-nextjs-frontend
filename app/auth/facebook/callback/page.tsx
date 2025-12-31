import { Suspense } from 'react';
import FacebookAuthCallback from '@/components/Pages/FacebookAuthCallback';

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Authenticating...</div>}>
      <FacebookAuthCallback />
    </Suspense>
  );
}
