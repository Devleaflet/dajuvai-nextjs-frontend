# Dajuvai E-commerce Platform - Next.js Frontend

A modern, high-performance e-commerce platform built with Next.js 16, React 19, and TypeScript. This is the frontend application for Dajuvai, a multi-vendor marketplace.

## 🚀 Features


- **Modern Tech Stack:** Next.js 16 with App Router, React 19, TypeScript
- **Performance Optimized:** React Compiler, Image Optimization, Code Splitting
- **SEO Ready:** Dynamic metadata, sitemap, robots.txt
- 
- **Multi-User Support:** Customer, Vendor, and Admin dashboards
- **Secure Authentication:** JWT-based auth with OAuth support (Google, Facebook)
- **Shopping Features:** Cart, Wishlist, Checkout, Order tracking
- **Payment Integration:** eSewa, Khalti, Cash on Delivery
- **Responsive Design:** Mobile-first, works on all devices
- **Real-time Updates:** TanStack Query for efficient data fetching

## 📋 Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- Backend API running (see backend documentation)

## 🛠️ Installation

```bash
# Clone the repository
git clone [repository-url]
cd next-frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Update .env.local with your values
# NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
# NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🏗️ Project Structure

```
next-frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   ├── shop/              # Shop pages
│   ├── admin/             # Admin dashboard
│   └── vendor/            # Vendor dashboard
├── components/            # React components
├── lib/                   # Core libraries
│   ├── api/              # API clients
│   ├── context/          # React contexts
│   ├── hooks/            # Custom hooks
│   └── utils/            # Utilities
├── public/               # Static assets
└── styles/               # CSS files
```

## 🔧 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🌍 Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

For production, create `.env.production`:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.dajuvai.com
NEXT_PUBLIC_FRONTEND_URL=https://dajuvai.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=production-google-client-id
```

## 🚢 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Docker

```bash
docker build -t next-frontend .
docker run -p 3000:3000 next-frontend
```

### Manual Deployment

```bash
npm run build
npm run start
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## 📚 Documentation

- [Handoff Documentation](./HANDOFF_DOCUMENTATION.md) - Complete project documentation
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Deployment instructions
- [Production Build Guide](./PRODUCTION_BUILD.md) - Build process
- [Performance Optimization](./PERFORMANCE_OPTIMIZATION.md) - Performance tips
- [Testing Checklist](./TESTING_CHECKLIST.md) - Testing procedures
- [Cross-Browser Testing](./CROSS_BROWSER_TESTING.md) - Browser compatibility
- [Post-Deployment Testing](./POST_DEPLOYMENT_TESTING.md) - Post-deployment checks

## 🧪 Testing

### Functional Testing
See [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) for comprehensive testing procedures.

### Cross-Browser Testing
See [CROSS_BROWSER_TESTING.md](./CROSS_BROWSER_TESTING.md) for browser compatibility testing.

### Performance Testing
Run Lighthouse audits and check Core Web Vitals. See [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md).

## 🔐 Security

- HTTPS enforced in production
- Security headers configured
- JWT token-based authentication
- Input sanitization
- CORS properly configured
- Environment variables secured

## 🎨 Tech Stack

- **Framework:** Next.js 16
- **UI Library:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS, CSS Modules
- **State Management:** React Context, TanStack Query
- **HTTP Client:** Axios
- **Forms:** React Hook Form (where applicable)
- **Icons:** Lucide React, React Icons
- **Charts:** Chart.js, Recharts
- **Notifications:** React Hot Toast

## 📱 Features by User Type

### Customer
- Browse products with filters
- Product search
- Shopping cart
- Wishlist
- Checkout and payment
- Order tracking
- User profile

### Vendor
- Dashboard with analytics
- Product management
- Order management
- Inventory tracking
- Profile management
- Notifications

### Admin
- System dashboard
- Product approval
- Order management
- Customer management
- Vendor management
- Category management
- Banner management
- Reports and analytics

## 🐛 Troubleshooting

### Build Fails
```bash
Remove-Item -Recurse -Force .next
npm run build
```

### Environment Variables Not Working
- Ensure variables start with `NEXT_PUBLIC_`
- Restart dev server after changes

### API Calls Fail
- Check API URL in `.env`
- Verify backend is running
- Check CORS configuration

See [HANDOFF_DOCUMENTATION.md](./HANDOFF_DOCUMENTATION.md) for more troubleshooting tips.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run linting: `npm run lint`
4. Test your changes
5. Submit a pull request

## 📄 License

[Your License Here]

## 👥 Team

- **Frontend Lead:** [Name]
- **Backend Lead:** [Name]
- **DevOps:** [Name]
- **QA Lead:** [Name]

## 📞 Support

- **Email:** support@dajuvai.com
- **Documentation:** See docs folder
- **Issues:** GitHub Issues

## 🔗 Links

- **Production:** https://dajuvai.com
- **Staging:** https://staging.dajuvai.com
- **API Docs:** [Backend API Documentation]
- **Design:** [Figma Link]

---

**Version:** 1.0.0  
**Last Updated:** December 12, 2024  
**Built with ❤️ by the Dajuvai Team**
