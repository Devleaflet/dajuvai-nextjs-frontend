'use client';

import React from 'react';
import { FaCartPlus } from 'react-icons/fa';

interface ProductActionsProps {
  product: {
    id: number;
    variants?: Array<{ id: number }>;
  };
  onAddToCart: () => void;
  onToggleWishlist: () => void;
  isWishlisted: boolean;
  wishlistLoading: boolean;
  cartOpen: boolean;
}

/**
 * ProductActions component displays action buttons for cart and wishlist
 */
const ProductActions: React.FC<ProductActionsProps> = ({
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
  wishlistLoading,
  cartOpen
}) => {
  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart();
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleWishlist();
  };

  return (
    <>
      {!cartOpen && (
        <>
          <button
            className="product-card__wishlist-button"
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            onClick={handleWishlistClick}
            disabled={wishlistLoading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={isWishlisted ? 'red' : 'none'}
              stroke={isWishlisted ? 'red' : 'currentColor'}
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>

          <div className="product-card__cart-button">
            <FaCartPlus
              style={{ color: '#ea5f0a', width: '25px' }}
              onClick={handleCartClick}
            />
          </div>
        </>
      )}
    </>
  );
};

export default ProductActions;
