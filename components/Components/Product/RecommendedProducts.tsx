'use client';

import React, { useEffect, useRef, useState } from 'react';
import { IoIosArrowDropleftCircle, IoIosArrowDroprightCircle } from "react-icons/io";
import { ApiProduct } from '@/lib/types/product';
import ProductCard from '../ProductCard';
import type { Product as UIProduct } from "@/lib/types/product";
import "@/styles/RecommendedProducts.css";

interface RecommendedProductsProps {
  products: ApiProduct[];
  currentProductId: number;
  // Optional fallbacks from current page URL if product items miss categoryId/subcategoryId
  fallbackCategoryId?: string | number;
  fallbackSubcategoryId?: string | number;
  isLoading?: boolean;
}

const RecommendedProducts: React.FC<RecommendedProductsProps> = ({
  products,
  currentProductId,
  fallbackCategoryId,
  fallbackSubcategoryId,
  isLoading = false
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [showScrollButtons, setShowScrollButtons] = useState<boolean>(false);
  const [needsScrolling, setNeedsScrolling] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [scrollLeft, setScrollLeft] = useState<number>(0);
  const scrollAmount = 300;

  // Filter out current product from recommendations
  const filteredProducts = products.filter(p => p.id !== currentProductId);

  useEffect(() => {
    const checkScrollNeeded = (): void => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const needsScroll = container.scrollWidth > container.clientWidth;
        setNeedsScrolling(needsScroll);
      }
    };

    const checkWidth = (): void => {
      setShowScrollButtons(window.innerWidth >= 768);
      checkScrollNeeded();
    };

    checkWidth();
    window.addEventListener("resize", checkWidth);

    return () => {
      window.removeEventListener("resize", checkWidth);
    };
  }, [filteredProducts]);

  useEffect(() => {
    const checkScrollNeeded = (): void => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const needsScroll = container.scrollWidth > container.clientWidth;
        setNeedsScrolling(needsScroll);
      }
    };

    // Check after component mounts and products are rendered
    const timer = setTimeout(checkScrollNeeded, 100);
    return () => clearTimeout(timer);
  }, [filteredProducts]);

  const scroll = (direction: "left" | "right"): void => {
    if (scrollContainerRef.current) {
      const scrollDistance = direction === "left" ? -scrollAmount : scrollAmount;
      scrollContainerRef.current.scrollBy({
        left: scrollDistance,
        behavior: "smooth",
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>): void => {
    if (scrollContainerRef.current && e.touches[0]) {
      setIsDragging(true);
      setStartX(e.touches[0].clientX);
      setScrollLeft(scrollContainerRef.current.scrollLeft);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>): void => {
    if (!isDragging || !scrollContainerRef.current || !e.touches[0]) return;
    e.preventDefault();
    const x = e.touches[0].clientX;
    const walk = (startX - x) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft + walk;
  };

  const handleTouchEnd = (): void => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.pointerEvents = "auto";
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.button !== 0) return;
    if (scrollContainerRef.current) {
      setIsDragging(true);
      setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
      setScrollLeft(scrollContainerRef.current.scrollLeft);
      scrollContainerRef.current.style.cursor = "grabbing";
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = (): void => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = "grab";
      scrollContainerRef.current.style.pointerEvents = "auto";
    }
  };

  const handleMouseLeave = (): void => {
    if (isDragging) {
      setIsDragging(false);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.style.cursor = "grab";
        scrollContainerRef.current.style.pointerEvents = "auto";
      }
    }
  };

  // Convert ApiProduct to UIProduct
  const convertToUIProduct = (apiProduct: ApiProduct): UIProduct => {
    // Derive IDs from multiple possible shapes
    const categoryId =
      (apiProduct as any).categoryId ??
      (apiProduct as any)?.category?.id ??
      (fallbackCategoryId != null ? Number(fallbackCategoryId) : undefined);
    const subcatId =
      (apiProduct as any).subcategoryId ??
      (apiProduct as any)?.subcategory?.id ??
      (fallbackSubcategoryId != null ? Number(fallbackSubcategoryId) : undefined);

    // Map ApiProduct to UI Product expected by ProductCard
    return {
      id: apiProduct.id,
      name: apiProduct.name,
      title: apiProduct.name,
      description: apiProduct.description || '',
      price: (apiProduct as any).price ?? apiProduct.basePrice ?? 0,
      basePrice: apiProduct.basePrice ?? null,
      discount: (apiProduct as any).discount ?? null,
      discountType: apiProduct.discountType ?? null,
      size: [],
      status: apiProduct.status || 'AVAILABLE',
      rating: Number((apiProduct as any).avgRating?.avg ?? (apiProduct as any).rating ?? 0) || 0,
      ratingCount: String(
        (Array.isArray((apiProduct as any).reviews) ? (apiProduct as any).reviews.length : undefined) ??
        (apiProduct as any).avgRating?.count ??
        (apiProduct as any).ratingCount ??
        0
      ),
      isBestSeller: false,
      freeDelivery: false,
      image: apiProduct.image || (apiProduct.productImages && apiProduct.productImages[0]) || '',
      stock: (apiProduct as any).stock ?? 0,
      category: categoryId != null ? { id: Number(categoryId) } as any : undefined,
      subcategory: subcatId != null
        ? { id: Number(subcatId), name: (apiProduct as any)?.subcategory?.name || '', image: null, createdAt: '', updatedAt: '' }
        : { id: 0, name: '', image: null, createdAt: '', updatedAt: '' },
      productImages: apiProduct.productImages || [],
      vendor: {
        id: (apiProduct as any).vendorId ?? 0,
        businessName: (apiProduct as any).vendor?.businessName ?? '',
        email: (apiProduct as any).vendor?.email ?? '',
        phoneNumber: (apiProduct as any).vendor?.phoneNumber ?? '',
        districtId: (apiProduct as any).vendor?.districtId ?? 0,
        isVerified: (apiProduct as any).vendor?.isVerified ?? false,
        createdAt: (apiProduct as any).vendor?.createdAt ?? '',
        updatedAt: (apiProduct as any).vendor?.updatedAt ?? '',
        district: {
          id: (apiProduct as any).vendor?.district?.id ?? 0,
          name: (apiProduct as any).vendor?.district?.name ?? '',
        },
      },
      inventory: [],
      vendorId: (apiProduct as any).vendorId ?? 0,
      created_at: (apiProduct as any).created_at ?? '',
      updated_at: (apiProduct as any).updated_at ?? '',
      deal: (apiProduct as any).deal ?? null,
    };
  };

  const RecommendedProductSkeleton = () => (
    <div className="recommended-product-card recommended-product-card--skeleton">
      <div className="recommended-product-card__image">
        <div className="recommended-product-card__image-skeleton skeleton"></div>
      </div>
      <div className="recommended-product-card__info">
        <div className="recommended-product-card__title-skeleton skeleton"></div>
        <div className="recommended-product-card__price-skeleton skeleton"></div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <section className="recommended-products">
        <div className="recommended-products__header">
          <h3 className="recommended-products__title">Recommended for you</h3>
          <p className="recommended-products__subtitle">Products you might love ❤️</p>
        </div>
        <div className="recommended-products__container">
          <div className="recommended-products__slider">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="recommended-product-card__wrapper">
                <RecommendedProductSkeleton />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <section className="recommended-products">
        <div className="recommended-products__header">
          <h3 className="recommended-products__title">Recommended for you</h3>
          <p className="recommended-products__subtitle">Products you might love ❤️</p>
        </div>
        <div className="recommended-empty">
          <div className="recommended-empty__icon">🛍️</div>
          <h4 className="recommended-empty__text">No recommendations available</h4>
          <p className="recommended-empty__subtext">
            We're working on finding the perfect products for you. Check back soon!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="recommended-products">
      <div className="recommended-products__header">
        <h3 className="recommended-products__title">Recommended for you</h3>
        <p className="recommended-products__subtitle">Products you might love ❤️</p>
      </div>
      <div className="recommended-products__container">
        {showScrollButtons && needsScrolling && (
          <button
            className="recommended-products__scroll-button recommended-products__scroll-button--left"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
          >
            <IoIosArrowDropleftCircle />
          </button>
        )}
        <div
          ref={scrollContainerRef}
          className={`recommended-products__slider ${isDragging ? "recommended-products__slider--dragging" : ""
            }`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {filteredProducts.slice(0, 8).map((product) => {
            const uiProduct = convertToUIProduct(product);
            return (
              <div key={product.id} className="recommended-product-card__wrapper">
                <ProductCard product={uiProduct as any} />
              </div>
            );
          })}
        </div>
        {showScrollButtons && needsScrolling && (
          <button
            className="recommended-products__scroll-button recommended-products__scroll-button--right"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
          >
            <IoIosArrowDroprightCircle />
          </button>
        )}
      </div>
    </section>
  );
};

export default RecommendedProducts;