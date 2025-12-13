# Performance Optimization Guide

## Completed Optimizations

### 1. Next.js Configuration
- ✅ React Compiler enabled for automatic optimizations
- ✅ SWC minification enabled
- ✅ Compression enabled
- ✅ Image optimization configured (AVIF, WebP)
- ✅ Package import optimization for react-icons, lucide-react, @mui/material
- ✅ Cache headers for static assets

### 2. Image Optimization
- ✅ Remote patterns configured for API images
- ✅ Multiple device sizes configured
- ✅ Modern formats (AVIF, WebP) enabled

### 3. Code Splitting
- ✅ Automatic code splitting via Next.js App Router
- ✅ Dynamic imports for heavy components (recommended)

## Recommended Optimizations

### 1. Component-Level Optimizations

#### Use Next.js Image Component
Replace all `<img>` tags with Next.js `<Image>`:

```tsx
// Before
<img src={product.image} alt={product.name} />

// After
import Image from 'next/image';
<Image 
  src={product.image} 
  alt={product.name}
  width={300}
  height={300}
  loading="lazy"
/>
```

#### Lazy Load Heavy Components
```tsx
// For modals, charts, and other heavy components
import dynamic from 'next/dynamic';

const ProductModal = dynamic(() => import('@/components/ProductModal'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});

const Chart = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), {
  ssr: false
});
```

#### Memoize Expensive Computations
```tsx
import { useMemo } from 'react';

const filteredProducts = useMemo(() => {
  return products.filter(p => p.price < maxPrice);
}, [products, maxPrice]);
```

#### Memoize Components
```tsx
import { memo } from 'react';

const ProductCard = memo(({ product }) => {
  return <div>...</div>;
});
```

### 2. Data Fetching Optimizations

#### Use React Query Cache Effectively
```tsx
// In lib/config.ts or query client setup
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

#### Prefetch Critical Data
```tsx
// In page components
export async function generateMetadata({ params }) {
  // This runs on the server and can prefetch data
  const product = await fetchProduct(params.id);
  return {
    title: product.name,
  };
}
```

#### Use Server Components Where Possible
```tsx
// app/shop/page.tsx - Server Component (no 'use client')
async function ShopPage() {
  const products = await fetchProducts(); // Runs on server
  return <ProductList products={products} />;
}
```

### 3. Bundle Size Optimization

#### Analyze Bundle
```bash
npm install @next/bundle-analyzer
```

Add to next.config.ts:
```typescript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

Run: `ANALYZE=true npm run build`

#### Tree-shake Lodash
```tsx
// Bad
import { debounce } from 'lodash';

// Good
import debounce from 'lodash/debounce';
```

#### Optimize Icon Imports
```tsx
// Bad - imports entire icon set
import { FaUser, FaCart } from 'react-icons/fa';

// Good - use lucide-react (already in deps)
import { User, ShoppingCart } from 'lucide-react';
```

### 4. CSS Optimization

#### Use CSS Modules
```tsx
// ProductCard.module.css
.card { ... }

// ProductCard.tsx
import styles from './ProductCard.module.css';
<div className={styles.card}>...</div>
```

#### Critical CSS
Next.js automatically inlines critical CSS, but ensure:
- Remove unused CSS
- Split large CSS files
- Use Tailwind's purge feature

### 5. Font Optimization

#### Use Next.js Font Optimization
```tsx
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

### 6. API Optimization

#### Implement Request Deduplication
React Query automatically deduplicates requests, but ensure:
```tsx
// Multiple components can call this simultaneously
// Only one request will be made
const { data } = useQuery({
  queryKey: ['product', id],
  queryFn: () => fetchProduct(id),
});
```

#### Use Parallel Requests
```tsx
const [products, categories] = await Promise.all([
  fetchProducts(),
  fetchCategories(),
]);
```

#### Implement Pagination
```tsx
// Use cursor-based or offset pagination
const { data, fetchNextPage } = useInfiniteQuery({
  queryKey: ['products'],
  queryFn: ({ pageParam = 1 }) => fetchProducts(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextPage,
});
```

### 7. Runtime Performance

#### Debounce Search Inputs
```tsx
import { useMemo } from 'react';
import debounce from 'lodash/debounce';

const debouncedSearch = useMemo(
  () => debounce((value) => setSearchTerm(value), 300),
  []
);
```

#### Virtualize Long Lists
```tsx
// For product lists with 100+ items
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: products.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 200,
});
```

### 8. Monitoring

#### Add Performance Monitoring
```tsx
// app/layout.tsx
export function reportWebVitals(metric) {
  if (metric.label === 'web-vital') {
    console.log(metric); // Send to analytics
  }
}
```

#### Use Lighthouse
```bash
# Run Lighthouse audit
npm run build
npm run start
# Then run Lighthouse in Chrome DevTools
```

## Performance Targets

### Core Web Vitals
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1

### Custom Metrics
- **Time to Interactive:** < 3.5s
- **First Contentful Paint:** < 1.5s
- **Bundle Size:** < 200KB (gzipped)

## Testing Performance

### Local Testing
```bash
# Production build
npm run build

# Start production server
npm run start

# Test with Chrome DevTools
# - Network tab (throttle to 3G)
# - Performance tab (record page load)
# - Lighthouse tab (run audit)
```

### Tools
- Chrome DevTools Lighthouse
- WebPageTest.org
- GTmetrix
- Next.js Analytics (Vercel)

## Checklist

- [ ] Replace img tags with Next.js Image
- [ ] Lazy load modals and heavy components
- [ ] Memoize expensive computations
- [ ] Optimize icon imports
- [ ] Implement virtual scrolling for long lists
- [ ] Add debouncing to search
- [ ] Analyze bundle size
- [ ] Optimize fonts
- [ ] Add performance monitoring
- [ ] Run Lighthouse audit
- [ ] Test on slow 3G network
- [ ] Measure Core Web Vitals

## Notes

- Focus on user-facing pages first (Home, Shop, Product)
- Test on real devices and networks
- Monitor performance in production
- Iterate based on real user data
