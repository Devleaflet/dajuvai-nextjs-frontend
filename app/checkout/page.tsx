import { Suspense } from 'react';
import CheckOut from '@/components/Pages/CheckOut';

export const metadata = {
  title: 'Checkout - Daju Vai',
  description: 'Complete your purchase',
};

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <CheckOut />
    </Suspense>
  );
}
