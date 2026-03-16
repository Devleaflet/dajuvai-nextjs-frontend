$content = Get-Content d:\next-frontend\next-frontend\styles\Shop.css -Raw
$content = $content -replace '(?s)\.shop-products \.product-card__cart-button \{.*?\n\s*\}', ".shop-products .product-card__cart-button {
        position: absolute;
        top: 195px;
        right: 20px;
        width: 34px;
        height: 34px;
        background: #f3f4f6;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        z-index: 10;
}
.shop-products .product-card__cart-button:hover {
        background: #e5e7eb;
}
.shop-products .product-card__cart-button svg {
        width: 16px !important;
        height: 16px !important;
        fill: #f97316 !important;
        color: #f97316 !important;
}
"
Set-Content d:\next-frontend\next-frontend\styles\Shop.css $content
