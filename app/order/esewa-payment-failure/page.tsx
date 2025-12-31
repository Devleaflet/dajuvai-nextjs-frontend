import { Suspense } from 'react';
import EsewaPaymentFailure from '@/components/Pages/EsewaPaymentFailure';

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <EsewaPaymentFailure />
    </Suspense>
  );
}
