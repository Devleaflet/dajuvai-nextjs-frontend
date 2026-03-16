$content = Get-Content d:\next-frontend\next-frontend\styles\Shop.css -Raw
$content = $content -replace '(?s)\.shop-products \{.*?grid-template-columns:.*?\}', ".shop-products {
        display: grid;
        gap: 20px;
        width: 100%;
        grid-area: products;
        align-content: start;
        height: fit-content;
        grid-template-columns: repeat(5, 1fr);
}
@media (max-width: 1400px) {
    .shop-products { grid-template-columns: repeat(4, 1fr); }
}
@media (max-width: 1024px) {
    .shop-products { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
    .shop-products { grid-template-columns: repeat(2, 1fr); gap: 12px; }
}
"
Set-Content d:\next-frontend\next-frontend\styles\Shop.css $content
