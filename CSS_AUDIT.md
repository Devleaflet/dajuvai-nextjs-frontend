# CSS File Usage Audit

## Priority Files for Tailwind Conversion

These are high-traffic components that should be converted first:

### 1. ProductCard.css
**Status:** ACTIVELY USED
**Used in:**
- `components/Components/ProductCard.tsx`
- `components/Components/SectionProducts.tsx`

**Priority:** HIGH - Core component used throughout the site

### 2. Navbar.css
**Status:** ACTIVELY USED
**Used in:**
- `components/Components/Navbar.tsx`

**Priority:** HIGH - Visible on every page

### 3. Footer.css
**Status:** ACTIVELY USED
**Used in:**
- `components/Components/Footer.tsx`

**Priority:** HIGH - Visible on every page

### 4. Cart.css
**Status:** ACTIVELY USED
**Used in:**
- `components/Components/Cart.tsx`

**Priority:** HIGH - Critical e-commerce functionality

### 5. Shop.css
**Status:** ACTIVELY USED
**Used in:**
- `components/Pages/Shop.tsx`
- `components/Components/SectionProducts.tsx`

**Priority:** HIGH - Main shopping page

## Other Actively Used CSS Files

### Layout & Navigation
- `Sidebar.css` - Used in `components/Components/Sidebar.tsx`
- `HeroSlider.css` - Used in `components/Components/ProductBannerSlider.tsx` and `ProductBanner.tsx`

### Product Related
- `ProductModal.css` - Used in `components/Components/ProductModal.tsx`
- `ProductCarousel.css` - Used in `components/Components/ProductCarousel.tsx`
- `ProductPage.css` - Used in `components/Pages/ProductPage.tsx`
- `RecommendedProducts.css` - Used in `components/Components/Product/RecommendedProducts.tsx`
- `NewProductModal.css` - Used in `components/Components/NewProductModalRedesigned.tsx`

### User Features
- `AuthModal.css` - Used in `components/Pages/VendorSignup.tsx` and `VendorLogin.tsx`
- `Wishlist.css` - Used in `components/Pages/Wishlist.tsx`
- `UserProfile.css` - Used in `components/Pages/UserProfile.tsx`
- `Reviews.css` - Used in `components/Components/Reviews.tsx`

### Admin & Vendor
- `AdminVendor.css` - Used in `components/Components/UnapprovedVendors.tsx`
- `VendorProduct.css` - Used in `components/Pages/VendorProduct.tsx`
- `VendorOrder.css` - Used in `components/Pages/VendorOrder.tsx`
- `VendorStore.css` - Used in `components/Pages/VendorStore.tsx`
- `ProfilePage.css` - Used in `components/Pages/ProfilePage.tsx`

### Utility Components
- `PageLoader.css` - Used in `components/Components/PageLoader.tsx`
- `Preloader.css` - Used in `components/Components/Preloader.tsx`
- `Table.css` - Used in `components/Components/Table/Table.tsx`
- `SpecialOffers.css` - Used in `components/Components/SpecialOffers.tsx`

### Skeleton Components
- `Skeleton.css` - Used in `components/Components/Skeleton/Skeleton.tsx`
- `ProductPageSkeleton.css` - Used in `components/skeleton/ProductPageSkeleton.tsx`

### Static Pages
- `About.css` - Used in `components/Pages/About.tsx`
- `AboutUs.css` - Used in `components/Pages/AboutUs.tsx`
- `Privacy.css` - Used in `components/Pages/Privacy.tsx`
- `TermsAndConditions.css` - Used in `components/Pages/TermsAndConditions.tsx`
- `ReturnRefundPolicy.css` - Used in `components/Pages/ReturnRefundPolicy.tsx`
- `VendorTerms.css` - Used in `components/Pages/VendorTerms.tsx`
- `WebsiteComingSoon.css` - Used in `components/Pages/WebsiteComingSoon.tsx`

### Payment & Orders
- `PaymentNPX.css` - Used in `components/Pages/Payment.tsx`
- `Transaction.css` - Used in `components/Pages/Transaction.tsx`

### Admin Components
- `AddCatalog.css` - Used in `components/Pages/AddCatalog.tsx`

## Potentially Unused CSS Files

These files may not be imported anywhere and could be candidates for deletion:

- `Shop.css.new` - Appears to be a backup/alternate version
- `AddVendorModal.css` - Need to verify usage
- `AdminBanner.css` - Need to verify usage
- `AdminCatalog.css` - Need to verify usage
- `AdminCategories.css` - Need to verify usage
- `AdminCategory.css` - Need to verify usage
- `AdminCustomers.css` - Need to verify usage
- `AdminDashboard.css` - Need to verify usage
- `AdminDistrict.css` - Need to verify usage
- `AdminOrders.css` - Need to verify usage
- `AdminProduct.css` - Need to verify usage
- `AdminProductModal.css` - Need to verify usage
- `AdminProfile.css` - Need to verify usage
- `AdminPromo.css` - Need to verify usage
- `AdminStaff.css` - Need to verify usage
- `BecomeVendor.css` - Need to verify usage
- `Catalog.css` - Need to verify usage
- `CategoryCatalogSection.css` - Need to verify usage
- `CategoryModal.css` - Need to verify usage
- `CategorySection.css` - Need to verify usage
- `CategorySlider.css` - Need to verify usage
- `CheckOut.css` - Need to verify usage
- `CommissionList.css` - Need to verify usage
- `Contact.css` - Need to verify usage
- `Dashboard.css` - Need to verify usage
- `DealAdmin.css` - Need to verify usage
- `DeleteModal.css` - Need to verify usage
- `EditModal.css` - Need to verify usage
- `Faq.css` - Need to verify usage
- `FilterSidebar.css` - Need to verify usage
- `Form.css` - Need to verify usage
- `GoogleAuthCallback.css` - Need to verify usage
- `Hero.css` - Need to verify usage
- `Home.css` - Need to verify usage
- `HomeBanner.css` - Need to verify usage
- `HomeCatalog.css` - Need to verify usage
- `HomeRecommendation.css` - Need to verify usage
- `Index.css` - Need to verify usage
- `Modal.css` - Need to verify usage
- `Notifications.css` - Need to verify usage
- `OffersSkeleton.css` - Need to verify usage
- `OrderList.css` - Need to verify usage
- `OrderModals.css` - Need to verify usage
- `OrderTrackingModal.css` - Need to verify usage
- `payment.css` - Need to verify usage
- `ProductCardSkeleton.css` - Need to verify usage
- `SliderSkeleton.css` - Need to verify usage
- `SubcategoriesViewModal.css` - Need to verify usage
- `SubCategoryModal.css` - Need to verify usage
- `VendorAuth.css` - Need to verify usage
- `VendorEdit.css` - Need to verify usage
- `VendorLogin.css` - Need to verify usage
- `VendorModal.css` - Need to verify usage
- `VendorViewModal.css` - Need to verify usage

## Conversion Strategy

1. **Phase 1 (High Priority):** Convert ProductCard, Navbar, Footer, Cart, Shop
2. **Phase 2:** Convert other actively used component CSS files
3. **Phase 3:** Audit and delete unused CSS files
4. **Phase 4:** Convert remaining CSS files as needed

## Notes

- Some CSS files in the `frontend/` directory (old Vite app) are not relevant for this audit
- Focus is on `next-frontend/` directory only
- After conversion, verify visual appearance matches original
- Test responsive behavior on mobile, tablet, and desktop
