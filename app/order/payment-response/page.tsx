import { Suspense } from 'react';
import Transaction from '@/components/Pages/Transaction';

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <Transaction />
    </Suspense>
  );
}
