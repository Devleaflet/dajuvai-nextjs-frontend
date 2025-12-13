# Deployment Guide

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

#### Advantages
- Zero configuration for Next.js
- Automatic deployments from Git
- Built-in CDN and edge network
- Automatic HTTPS
- Preview deployments for PRs
- Excellent performance
- Free tier available

#### Setup Steps

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
cd next-frontend
vercel
```

4. **Configure Environment Variables**
```bash
# Via CLI
vercel env add NEXT_PUBLIC_API_BASE_URL production
vercel env add NEXT_PUBLIC_GOOGLE_CLIENT_ID production

# Or via Vercel Dashboard:
# 1. Go to project settings
# 2. Navigate to Environment Variables
# 3. Add variables for Production
```

5. **Deploy to Production**
```bash
vercel --prod
```

#### Vercel Configuration
```json
// vercel.json (optional)
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_API_BASE_URL": "@api-base-url",
    "NEXT_PUBLIC_GOOGLE_CLIENT_ID": "@google-client-id"
  }
}
```

### Option 2: AWS (EC2 + Load Balancer)

#### Architecture
```
Internet → Route 53 → ALB → EC2 Instances → RDS (if needed)
                      ↓
                   CloudFront (CDN)
```

#### Setup Steps

1. **Prepare EC2 Instance**
```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2
```

2. **Deploy Application**
```bash
# Clone repository
git clone https://github.com/your-repo/next-frontend.git
cd next-frontend

# Install dependencies
npm install

# Build
npm run build

# Start with PM2
pm2 start npm --name "next-frontend" -- start
pm2 save
pm2 startup
```

3. **Configure Nginx (Reverse Proxy)**
```nginx
# /etc/nginx/sites-available/next-frontend
server {
    listen 80;
    server_name dajuvai.com www.dajuvai.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

4. **Enable Site**
```bash
sudo ln -s /etc/nginx/sites-available/next-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

5. **Setup SSL with Let's Encrypt**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d dajuvai.com -d www.dajuvai.com
```

6. **Configure Environment Variables**
```bash
# Create .env.production
cat > .env.production << EOF
NEXT_PUBLIC_API_BASE_URL=https://api.dajuvai.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-production-client-id
NEXT_PUBLIC_FRONTEND_URL=https://dajuvai.com
EOF
```

### Option 3: Docker + Docker Compose

#### Dockerfile
```dockerfile
# next-frontend/Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./next-frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_BASE_URL=https://api.dajuvai.com
      - NEXT_PUBLIC_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - NEXT_PUBLIC_FRONTEND_URL=https://dajuvai.com
    restart: unless-stopped
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

#### Deploy with Docker
```bash
# Build image
docker build -t next-frontend:latest ./next-frontend

# Run container
docker run -d \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=https://api.dajuvai.com \
  -e NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id \
  --name next-frontend \
  next-frontend:latest

# Or use Docker Compose
docker-compose up -d
```

### Option 4: Netlify

#### Setup Steps

1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Login**
```bash
netlify login
```

3. **Initialize**
```bash
cd next-frontend
netlify init
```

4. **Configure**
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NEXT_TELEMETRY_DISABLED = "1"
```

5. **Deploy**
```bash
netlify deploy --prod
```

## CI/CD Setup

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: next-frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: ./next-frontend
        run: npm ci
      
      - name: Run linting
        working-directory: ./next-frontend
        run: npm run lint
      
      - name: Build
        working-directory: ./next-frontend
        run: npm run build
        env:
          NEXT_PUBLIC_API_BASE_URL: ${{ secrets.API_BASE_URL }}
          NEXT_PUBLIC_GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./next-frontend
          vercel-args: '--prod'
```

### GitLab CI/CD

```yaml
# .gitlab-ci.yml
stages:
  - build
  - deploy

variables:
  NODE_VERSION: "20"

build:
  stage: build
  image: node:${NODE_VERSION}
  script:
    - cd next-frontend
    - npm ci
    - npm run lint
    - npm run build
  artifacts:
    paths:
      - next-frontend/.next
    expire_in: 1 hour
  only:
    - main

deploy:
  stage: deploy
  image: node:${NODE_VERSION}
  script:
    - cd next-frontend
    - npm install -g vercel
    - vercel --token $VERCEL_TOKEN --prod
  dependencies:
    - build
  only:
    - main
```

## Environment Configuration

### Production Environment Variables

```env
# Required
NEXT_PUBLIC_API_BASE_URL=https://api.dajuvai.com
NEXT_PUBLIC_FRONTEND_URL=https://dajuvai.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-production-google-client-id

# Optional
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=production
```

### Staging Environment Variables

```env
NEXT_PUBLIC_API_BASE_URL=https://staging-api.dajuvai.com
NEXT_PUBLIC_FRONTEND_URL=https://staging.dajuvai.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-staging-google-client-id
```

## DNS Configuration

### Domain Setup

1. **Add A Record**
```
Type: A
Name: @
Value: Your-Server-IP
TTL: 3600
```

2. **Add CNAME for www**
```
Type: CNAME
Name: www
Value: dajuvai.com
TTL: 3600
```

3. **For Vercel**
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
TTL: 3600
```

## SSL/TLS Configuration

### Let's Encrypt (Free)
```bash
sudo certbot --nginx -d dajuvai.com -d www.dajuvai.com
```

### Cloudflare (Free)
1. Add site to Cloudflare
2. Update nameservers
3. Enable SSL/TLS (Full or Full Strict)
4. Enable Always Use HTTPS

## Monitoring & Logging

### Setup Monitoring

1. **Vercel Analytics** (if using Vercel)
```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

2. **Google Analytics**
```tsx
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GA_MEASUREMENT_ID');
          `}
        </Script>
      </body>
    </html>
  );
}
```

3. **Error Tracking (Sentry)**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### Logging

```bash
# PM2 Logs
pm2 logs next-frontend

# Docker Logs
docker logs -f next-frontend

# Nginx Logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## Backup & Recovery

### Backup Strategy

1. **Code:** Git repository (GitHub/GitLab)
2. **Environment Variables:** Secure vault (1Password, AWS Secrets Manager)
3. **Build Artifacts:** S3 or similar storage

### Recovery Plan

1. **Rollback Deployment**
```bash
# Vercel
vercel rollback

# PM2
pm2 restart next-frontend --update-env
```

2. **Restore from Backup**
```bash
git checkout previous-stable-tag
npm install
npm run build
pm2 restart next-frontend
```

## Performance Optimization

### CDN Configuration

1. **Cloudflare**
   - Enable caching
   - Enable Brotli compression
   - Enable HTTP/3
   - Configure cache rules

2. **AWS CloudFront**
   - Create distribution
   - Configure origin (ALB or S3)
   - Set cache behaviors
   - Enable compression

### Caching Strategy

```nginx
# Nginx caching
location /_next/static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location /static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Security Checklist

- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Environment variables secured
- [ ] API keys not exposed
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] DDoS protection enabled
- [ ] Regular security updates
- [ ] Firewall configured
- [ ] SSH key-based authentication

## Deployment Checklist

### Pre-Deployment
- [ ] Code reviewed and approved
- [ ] All tests passing
- [ ] Build successful locally
- [ ] Environment variables configured
- [ ] DNS configured
- [ ] SSL certificate ready
- [ ] Backup plan in place

### Deployment
- [ ] Deploy to staging first
- [ ] Test on staging
- [ ] Deploy to production
- [ ] Verify deployment
- [ ] Test critical flows
- [ ] Monitor for errors

### Post-Deployment
- [ ] Verify site is live
- [ ] Check all pages load
- [ ] Test authentication
- [ ] Test API integration
- [ ] Monitor performance
- [ ] Check error logs
- [ ] Update documentation

## Troubleshooting

### Common Issues

**Issue:** Build fails on deployment
```bash
# Check build logs
# Verify environment variables
# Check Node.js version
```

**Issue:** Site not accessible
```bash
# Check DNS propagation
# Verify SSL certificate
# Check firewall rules
# Check server status
```

**Issue:** API calls fail
```bash
# Verify API URL
# Check CORS configuration
# Verify API is running
# Check network connectivity
```

## Rollback Procedure

1. **Identify Issue**
2. **Notify Team**
3. **Execute Rollback**
```bash
# Vercel
vercel rollback

# Manual
git revert HEAD
git push
# Redeploy
```
4. **Verify Rollback**
5. **Investigate Issue**
6. **Fix and Redeploy**

## Support & Maintenance

### Regular Tasks
- Monitor error logs daily
- Check performance metrics weekly
- Update dependencies monthly
- Review security advisories weekly
- Backup verification monthly

### Emergency Contacts
- DevOps Team: [contact]
- Backend Team: [contact]
- Infrastructure: [contact]

## Next Steps

After deployment:
1. Proceed to TASK-044: Post-Deployment Testing
2. Monitor application for 24-48 hours
3. Gather user feedback
4. Address any issues
5. Document lessons learned
