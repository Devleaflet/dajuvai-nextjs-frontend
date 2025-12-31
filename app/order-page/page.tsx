import { Suspense } from 'react';
import Payment from '@/components/Pages/Payment';

export const metadata = {
  title: 'Order Payment - Daju Vai',
  description: 'Complete your payment',
};

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <Payment />
    </Suspense>
  );
}
