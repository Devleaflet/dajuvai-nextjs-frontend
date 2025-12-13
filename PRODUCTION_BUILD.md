# Production Build Guide

## Pre-Build Checklist

### Environment Configuration
- [x] `.env.production` file created
- [ ] Production API URL configured
- [ ] Google OAuth client ID updated for production
- [ ] All environment variables verified
- [ ] No sensitive data in client-side env vars

### Code Quality
- [ ] All TypeScript errors fixed
- [ ] ESLint warnings addressed
- [ ] No console.log statements in production code
- [ ] All TODO comments reviewed
- [ ] Dead code removed
- [ ] Unused imports removed

### Dependencies
- [ ] All dependencies up to date
- [ ] No security vulnerabilities (`npm audit`)
- [ ] Production dependencies only in dependencies
- [ ] Dev dependencies in devDependencies

### Testing
- [ ] All functional tests passing
- [ ] Critical user flows tested
- [ ] API integration tested
- [ ] Authentication flows verified

## Build Process

### 1. Clean Previous Builds
```bash
# Remove previous build artifacts
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force out
```

### 2. Install Dependencies
```bash
# Clean install
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

### 3. Run Linting
```bash
npm run lint
```

### 4. Build for Production
```bash
# Set NODE_ENV to production
$env:NODE_ENV="production"

# Run build
npm run build
```

### 5. Test Production Build Locally
```bash
# Start production server
npm run start

# Test at http://localhost:3000
```

## Build Output Analysis

### Expected Output
```
Route (app)                              Size     First Load JS
┌ ○ /                                    X kB          XX kB
├ ○ /about                               X kB          XX kB
├ ○ /admin/dashboard                     X kB          XX kB
├ ○ /shop                                X kB          XX kB
└ ○ /product-page/[id]                   X kB          XX kB

○  (Static)  prerendered as static content
●  (SSG)     prerendered as static HTML (uses getStaticProps)
λ  (Server)  server-side renders at runtime
```

### Size Targets
- **First Load JS:** < 200 KB (target)
- **Page Size:** < 50 KB per page
- **Total Bundle:** < 500 KB

### Analyze Bundle Size
```bash
# Install analyzer
npm install --save-dev @next/bundle-analyzer

# Run analysis
$env:ANALYZE="true"
npm run build
```

## Build Optimization

### 1. Code Splitting
Ensure dynamic imports for heavy components:
```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
  ssr: false
});
```

### 2. Image Optimization
Verify all images use Next.js Image component:
```tsx
import Image from 'next/image';

<Image 
  src="/path/to/image.jpg"
  alt="Description"
  width={500}
  height={300}
  priority={false} // Only true for above-fold images
/>
```

### 3. Font Optimization
Use Next.js font optimization:
```tsx
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
```

### 4. Remove Unused CSS
Tailwind automatically purges unused CSS in production.

### 5. Minification
Next.js automatically minifies JS and CSS in production.

## Environment Variables

### Production Environment Variables
```env
# .env.production
NEXT_PUBLIC_API_BASE_URL=https://api.dajuvai.com
NEXT_PUBLIC_FRONTEND_URL=https://dajuvai.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-production-google-client-id
```

### Verify Environment Variables
```tsx
// Add to a test page temporarily
console.log('API URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
console.log('Frontend URL:', process.env.NEXT_PUBLIC_FRONTEND_URL);
```

## Security Checklist

### Headers
- [x] X-Frame-Options configured
- [x] X-Content-Type-Options configured
- [x] X-XSS-Protection configured
- [x] Referrer-Policy configured
- [ ] Content-Security-Policy configured (optional)

### API Security
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] API rate limiting in place
- [ ] Authentication tokens secure
- [ ] No sensitive data in URLs

### Client-Side Security
- [ ] No API keys in client code
- [ ] Input sanitization implemented
- [ ] XSS protection in place
- [ ] CSRF protection implemented

## Performance Checklist

### Core Web Vitals
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1

### Optimization
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Lazy loading for below-fold content
- [ ] Fonts optimized
- [ ] CSS minified
- [ ] JS minified
- [ ] Gzip/Brotli compression enabled

## Build Verification

### 1. Functionality Testing
- [ ] Home page loads
- [ ] Navigation works
- [ ] Authentication works
- [ ] API calls work
- [ ] Forms submit
- [ ] Images load
- [ ] Payments work

### 2. Performance Testing
```bash
# Run Lighthouse
# Chrome DevTools > Lighthouse > Generate Report

# Target Scores:
# Performance: > 90
# Accessibility: > 90
# Best Practices: > 90
# SEO: > 90
```

### 3. Error Checking
- [ ] No console errors
- [ ] No 404 errors
- [ ] No CORS errors
- [ ] No API errors
- [ ] Error boundaries work

### 4. SEO Verification
- [ ] Meta tags present
- [ ] Open Graph tags present
- [ ] Sitemap generated
- [ ] Robots.txt present
- [ ] Canonical URLs set

## Build Artifacts

### Output Directory Structure
```
.next/
├── cache/              # Build cache
├── server/             # Server-side code
│   ├── app/           # App routes
│   └── chunks/        # Code chunks
├── static/            # Static assets
│   ├── chunks/        # JS chunks
│   ├── css/           # CSS files
│   └── media/         # Images, fonts
└── trace              # Build trace
```

### Important Files
- `.next/BUILD_ID` - Unique build identifier
- `.next/routes-manifest.json` - Route configuration
- `.next/prerender-manifest.json` - Prerendered pages

## Deployment Preparation

### 1. Build Package
```bash
# Create deployment package
npm run build

# The .next folder contains everything needed
```

### 2. Required Files for Deployment
```
next-frontend/
├── .next/              # Build output (required)
├── public/             # Static files (required)
├── node_modules/       # Dependencies (required)
├── package.json        # Dependencies list (required)
├── package-lock.json   # Lock file (required)
├── next.config.ts      # Configuration (required)
└── .env.production     # Environment variables (required)
```

### 3. Exclude from Deployment
```
# .gitignore (already configured)
node_modules/
.next/
.env.local
.env.development
*.log
```

## Troubleshooting

### Build Fails

**Issue:** TypeScript errors
```bash
# Check for errors
npm run build

# Fix errors in reported files
```

**Issue:** Out of memory
```bash
# Increase Node memory
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

**Issue:** Module not found
```bash
# Clean install
Remove-Item -Recurse -Force node_modules
npm install
npm run build
```

### Build Succeeds but App Doesn't Work

**Issue:** Environment variables not loaded
- Check `.env.production` exists
- Verify variable names start with `NEXT_PUBLIC_`
- Restart build process

**Issue:** API calls fail
- Verify API URL in production env
- Check CORS configuration
- Verify API is accessible

**Issue:** Images don't load
- Check image paths
- Verify remote patterns in next.config.ts
- Check image optimization settings

## Production Build Commands

### Standard Build
```bash
npm run build
npm run start
```

### Build with Analysis
```bash
$env:ANALYZE="true"
npm run build
```

### Build with Profiling
```bash
npm run build -- --profile
```

### Build for Static Export (if needed)
```bash
# Add to next.config.ts
output: 'export'

# Then build
npm run build
```

## Post-Build Checklist

- [ ] Build completes without errors
- [ ] Build size is acceptable
- [ ] No security vulnerabilities
- [ ] Environment variables correct
- [ ] Production server starts
- [ ] All pages accessible
- [ ] API integration works
- [ ] Authentication works
- [ ] Performance targets met
- [ ] SEO tags present
- [ ] Error handling works
- [ ] Ready for deployment

## Build Metrics

### Target Metrics
- **Build Time:** < 5 minutes
- **Bundle Size:** < 500 KB
- **First Load JS:** < 200 KB
- **Build Success Rate:** 100%

### Actual Metrics
- **Build Time:** ___ minutes
- **Bundle Size:** ___ KB
- **First Load JS:** ___ KB
- **Build Success Rate:** ___%

## Notes

- Always test production build locally before deploying
- Keep build logs for troubleshooting
- Monitor build times for performance regression
- Update this document with any build issues encountered
- Document any custom build scripts or processes

## Next Steps

After successful build:
1. Proceed to TASK-043: Deployment Setup
2. Deploy to staging environment first
3. Run post-deployment tests
4. Deploy to production
5. Monitor for issues
