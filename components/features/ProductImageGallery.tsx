'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { processImageUrl } from '@/lib/utils/imageUrl';

interface ProductImageGalleryProps {
  images: string[];
  alt: string;
  onError?: () => void;
}

/**
 * ProductImageGallery component displays product images with auto-rotation on hover
 * and pagination dots for manual navigation
 */
const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  images,
  alt,
  onError
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Validate and process images array
  const validImages = images && images.length > 0
    ? images.map(img => processImageUrl(img))
    : ['/assets/logo.webp'];
  const hasMultipleImages = validImages.length > 1;

  // Reset currentIndex if it's out of bounds
  useEffect(() => {
    if (currentIndex >= validImages.length) {
      setCurrentIndex(0);
    }
  }, [validImages.length, currentIndex]);

  // Auto-rotate images on hover
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isHovering && hasMultipleImages && !imageError) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % validImages.length);
      }, 1500); // Change image every 1.5 seconds
    } else if (!isHovering) {
      setCurrentIndex(0); // Reset to first image when not hovering
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHovering, validImages.length, hasMultipleImages, imageError]);

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
    if (onError) {
      onError();
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleDotClick = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(index);
    setIsHovering(false); // Stop auto-rotation when manually selecting
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setCurrentIndex(index);
      setIsHovering(false);
    }
  };

  const displayImage = imageError
    ? '/assets/logo.webp'
    : (validImages[currentIndex] || '/assets/logo.webp');
  const maxDotsToShow = 5;
  const shouldShowMoreIndicator = validImages.length > maxDotsToShow;

  return (
    <div
      className="product-card__image"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      role="region"
      aria-label="Product image gallery"
    >
      <div style={{ position: 'relative', width: '100%', height: 'auto' }}>
        <Image
          src={displayImage}
          alt={`${alt} - Image ${currentIndex + 1} of ${validImages.length}`}
          width={300}
          height={300}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={handleImageError}
          onLoad={handleImageLoad}
          style={{ objectFit: 'cover', width: '100%', height: 'auto' }}
          priority={currentIndex === 0}
        />

        {isLoading && !imageError && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f3f4f6'
            }}
            aria-label="Loading image"
          >
            <div className="spinner" />
          </div>
        )}
      </div>

      {hasMultipleImages && !imageError && (
        <div className="product-card__pagination product-card__pagination--inside">
          <div
            className="product-card__dots"
            role="tablist"
            aria-label="Image navigation"
          >
            {validImages.slice(0, maxDotsToShow).map((_, index) => (
              <span
                key={index}
                role="tab"
                aria-selected={index === currentIndex}
                aria-label={`View image ${index + 1}`}
                tabIndex={0}
                className={`product-card__dot ${index === currentIndex ? 'product-card__dot--active' : ''}`}
                onClick={(e) => handleDotClick(index, e)}
                onKeyDown={(e) => handleKeyDown(index, e)}
              />
            ))}
            {shouldShowMoreIndicator && (
              <span
                className="product-card__dot product-card__dot--more"
                aria-label={`${validImages.length - maxDotsToShow} more images`}
              >
                +{validImages.length - maxDotsToShow}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
