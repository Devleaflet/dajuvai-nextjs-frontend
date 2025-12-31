import { Suspense } from 'react';
import VendorOrder from '@/components/Pages/VendorOrder';

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <VendorOrder />
    </Suspense>
  );
}
