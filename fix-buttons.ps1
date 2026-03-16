$content = Get-Content d:\next-frontend\next-frontend\styles\Shop.css -Raw
$content += @"

.shop-products .product-card__wishlist-button {
    position: absolute;
    top: 10px;
    left: 10px;
    width: 32px;
    height: 32px;
    background: #ffffff;
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    z-index: 10;
}
.shop-products .product-card__wishlist-button svg {
    width: 16px;
    height: 16px;
    stroke: #ef4444 !important;
}

