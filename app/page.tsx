import { Suspense } from 'react';
import Home from '@/components/Pages/Home';

export const metadata = {
  title: 'Daju Vai - Your Trusted E-commerce Platform',
  description: 'Shop quality products from trusted vendors across Nepal',
  openGraph: {
    title: 'Daju Vai - Your Trusted E-commerce Platform',
    description: 'Shop quality products from trusted vendors across Nepal',
  },
};

export default function HomePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <Home />
    </Suspense>
  );
}

