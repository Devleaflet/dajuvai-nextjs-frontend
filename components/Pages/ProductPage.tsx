'use client';

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter, useParams } from "next/navigation";
import { Truck, Undo2, ShieldCheck, Phone } from "lucide-react";
import React from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import axiosInstance from "@/lib/api/axiosInstance";
import { addToWishlist } from "@/lib/api/wishlist";
import Footer from "@/components/Components/Footer";
import Navbar from "@/components/Components/Navbar";
import Preloader from "@/components/Components/Preloader";
import RecommendedProducts from "@/components/Components/Product/RecommendedProducts";
import Reviews from "@/components/Components/Reviews";
import { useAuth } from "@/lib/context/AuthContext";
import { useCart } from "@/lib/context/CartContext";
import ScrollToTop from "@/components/Components/ScrollToTop";
import { sanitizeRichText } from "@/lib/utils/sanitize";
import { processImageUrl } from "@/lib/utils/imageUrl";

const AuthModal = dynamic(() => import("@/components/Components/AuthModal"), { ssr: false });
const CACHE_KEY_REVIEWS = "productReviewsData";

interface Category {
  id: number;
  name: string;
  createdBy?: { id: number; username: string };
  subcategories?: Array<{ id: number; name: string }>;
}

interface Review {
  id: number;
  userId: number;
  rating: number;
  comment: string;
  createdAt: string;
  user?: { username?: string; email?: string };
}

interface ReviewsResponse {
  success: boolean;
  data: { averageRating: number; reviews: Review[]; total: number; totalPages: number };
}

const ProductPage = () => {
  const toFullUrl = (imgUrl: string) => (!imgUrl ? "" : processImageUrl(imgUrl));

  const { id: productId, categoryId, subcategoryId } = useParams<{
    id: string; categoryId?: string; subcategoryId?: string;
  }>();
  const id = productId;

  const [selectedColor, setSelectedColor] = useState("");
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [imageError, setImageError] = useState<boolean[]>([]);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [isZoomActive, setIsZoomActive] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const mainImageRef = useRef<HTMLDivElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const ZOOM_LEVEL = 3;

  const { handleCartOnAdd } = useCart();
  const { token, isAuthenticated } = useAuth();
  const router = useRouter();

  /* ── Data fetching ─────────────────────────────────────────────────────── */
  const { data: productData, isLoading: isProductLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!id || isNaN(Number(id))) throw new Error("Invalid product ID");
      const response = await axiosInstance.get(`/api/product/${id}`);
      const apiProduct = response.data.product;
      if (!apiProduct) throw new Error("Product not found");

      const variantImages: string[] = [];
      let allVariants: any[] = [];
      let defaultVariant: any = null;

      if (apiProduct.variants && Array.isArray(apiProduct.variants)) {
        allVariants = apiProduct.variants.map((variant: any) => {
          const variantImgUrls: string[] = [];
          if (variant.variantImages && Array.isArray(variant.variantImages)) {
            variant.variantImages.forEach((img: any) => {
              try {
                let imgUrl = "";
                if (typeof img === "string") {
                  try { const p = JSON.parse(img); imgUrl = p.url || p.imageUrl || img; } catch { imgUrl = img; }
                } else if (img && typeof img === "object") { imgUrl = img.url || img.imageUrl || ""; }
                if (imgUrl) { const f = toFullUrl(imgUrl); variantImgUrls.push(f); if (!variantImages.includes(f)) variantImages.push(f); }
              } catch (e) { console.error(e, img); }
            });
          }
          const basePrice = parseFloat(variant.basePrice) || 0;
          const discount = parseFloat(variant.discount) || 0;
          let price = basePrice, savings = 0;
          if (variant.discountType === "PERCENTAGE") { savings = basePrice * (discount / 100); price = basePrice - savings; }
          else if (variant.discountType === "FLAT") { savings = discount; price = basePrice - discount; }
          const vd = { ...variant, variantImgUrls, calculatedPrice: price, calculatedSavings: savings, originalPrice: basePrice, stock: variant.stock || 0, status: variant.status || "AVAILABLE" };
          if (!defaultVariant) defaultVariant = vd;
          return vd;
        });
      }

      const productImages = Array.isArray(apiProduct.productImages)
        ? apiProduct.productImages.map((img: any) => {
          try {
            let imgUrl = "";
            if (typeof img === "string") { try { const p = JSON.parse(img); imgUrl = p.url || p.imageUrl || img; } catch { imgUrl = img; } }
            else if (img && typeof img === "object") { imgUrl = img.url || img.imageUrl || ""; }
            return imgUrl ? toFullUrl(imgUrl) : "";
          } catch { return ""; }
        }).filter(Boolean) : [];

      const allImages = [...new Set([...productImages, ...variantImages])].filter(Boolean);
      let productPrice = 0, productOriginalPrice = 0;
      if (apiProduct.hasVariants) {
        if (defaultVariant) { productPrice = defaultVariant.calculatedPrice; productOriginalPrice = defaultVariant.originalPrice; }
      } else {
        const bp = parseFloat(apiProduct.basePrice) || 0, disc = parseFloat(apiProduct.discount) || 0;
        productOriginalPrice = bp; productPrice = bp;
        if (apiProduct.discountType === "PERCENTAGE") productPrice = bp - bp * (disc / 100);
        else if (apiProduct.discountType === "FLAT") productPrice = bp - disc;
      }
      const derivedCategoryId = apiProduct?.category?.id != null ? Number(apiProduct.category.id) : (apiProduct as any)?.categoryId != null ? Number((apiProduct as any).categoryId) : undefined;
      const derivedSubcategoryId = apiProduct?.subcategory?.id != null ? Number(apiProduct.subcategory.id) : (apiProduct as any)?.subcategoryId != null ? Number((apiProduct as any).subcategoryId) : undefined;
      return {
        product: {
          id: apiProduct.id, name: apiProduct.name, description: apiProduct.description,
          price: productPrice.toFixed(2), originalPrice: productOriginalPrice > productPrice ? productOriginalPrice.toFixed(2) : undefined,
          rating: 0, ratingCount: "0", image: allImages[0] || "",
          brand: apiProduct.brand?.name || "Unknown Brand",
          category: derivedCategoryId != null ? { id: derivedCategoryId, name: apiProduct?.category?.name || "Category" } : undefined,
          subcategory: derivedSubcategoryId != null ? { id: derivedSubcategoryId, name: apiProduct?.subcategory?.name || "Subcategory" } : undefined,
          vendor: apiProduct.vendor || { id: null, businessName: "Unknown Vendor" },
          productImages: allImages, colors: [], sizeOptions: [],
          stock: apiProduct.stock || defaultVariant?.stock || 0,
          isBestSeller: false, variants: allVariants, hasVariants: apiProduct.hasVariants || false, selectedVariant: defaultVariant,
        },
        vendorId: apiProduct.vendorId || null,
      };
    },
    staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000,
  });

  const { data: reviewsData, isLoading: isReviewsLoading } = useQuery({
    queryKey: ["reviews", id, currentReviewPage],
    queryFn: async () => {
      if (!id || isNaN(Number(id))) throw new Error("Invalid product ID");
      const response = await axiosInstance.get<ReviewsResponse>(`/api/reviews/${id}?page=${currentReviewPage}`);
      if (!response.data.success) throw new Error("Failed to fetch reviews");
      return { reviews: response.data.data.reviews || [], averageRating: response.data.data.averageRating || 0, totalReviews: response.data.data.total || 0, totalPages: response.data.data.totalPages || 1 };
    },
    staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000,
  });

  const product = productData?.product;
  const effectiveCategoryId = categoryId ?? (product?.category?.id != null ? String(product.category.id) : undefined);
  const effectiveSubcategoryId = subcategoryId ?? (product?.subcategory?.id != null ? String(product.subcategory.id) : undefined);

  const { data: recommendedProducts, isLoading: isLoadingRecommended } = useQuery({
    queryKey: ["recommendedProducts", effectiveCategoryId, effectiveSubcategoryId],
    queryFn: async () => {
      const fetch = async (p: URLSearchParams) => {
        const url = p.toString() ? `/api/categories/all/products?${p.toString()}` : `/api/categories/all/products`;
        const res = await axiosInstance.get(url);
        return ((res?.data?.data ?? []) as any[]).map((p) => ({ ...p, rating: p.avgRating || p.rating || 0, ratingCount: p.count || p.reviews?.length || 0 }));
      };
      try {
        if (effectiveCategoryId && effectiveSubcategoryId) {
          let d = await fetch(new URLSearchParams({ categoryId: String(effectiveCategoryId), subcategoryId: String(effectiveSubcategoryId) }));
          if (!Array.isArray(d) || d.length <= 1) d = await fetch(new URLSearchParams({ categoryId: String(effectiveCategoryId) }));
          if (!Array.isArray(d) || d.length <= 1) d = await fetch(new URLSearchParams());
          return d;
        }
        if (effectiveSubcategoryId) { let d = await fetch(new URLSearchParams({ subcategoryId: String(effectiveSubcategoryId) })); if (!Array.isArray(d) || d.length <= 1) d = await fetch(new URLSearchParams()); return d; }
        if (effectiveCategoryId) { let d = await fetch(new URLSearchParams({ categoryId: String(effectiveCategoryId) })); if (!Array.isArray(d) || d.length <= 1) d = await fetch(new URLSearchParams()); return d; }
        return await fetch(new URLSearchParams());
      } catch { return []; }
    },
    enabled: true, staleTime: 5 * 60 * 1000,
  });

  const { data: categoryData } = useQuery<{ data: Category }>({
    queryKey: ["category", categoryId],
    queryFn: async () => { if (!categoryId) return null; try { const r = await axiosInstance.get(`/api/categories/${categoryId}`); return r.data; } catch { return null; } },
    enabled: !!categoryId, staleTime: 5 * 60 * 1000,
  });

  const reviews = (reviewsData?.reviews || []).map((r: Review) => ({ ...r, userName: r.user?.username || r.user?.email?.split("@")[0] || "Anonymous" }));
  const averageRating = reviewsData?.averageRating || 0;
  const totalReviews = reviewsData?.totalReviews || 0;
  const totalPages = reviewsData?.totalPages || 1;

  /* ── Effects ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (product) {
      const dv = product.hasVariants && product.variants?.length > 0 ? product.variants[0] : null;
      setSelectedColor(dv?.attributes?.color || "");
      setSelectedVariant(dv);
      const imgs = dv?.variantImgUrls?.length > 0 ? dv.variantImgUrls : product.productImages || [];
      setImageError(new Array(imgs?.length || 1).fill(false));
    }
  }, [product]);

  const getCurrentImages = () => {
    if (selectedVariant?.variantImgUrls?.length > 0) return selectedVariant.variantImgUrls;
    if (product?.hasVariants && product?.variants?.[0]?.variantImgUrls?.length > 0) return product.variants[0].variantImgUrls;
    return product?.productImages || [];
  };

  useEffect(() => {
    const imgs = getCurrentImages();
    setImageError(new Array(imgs?.length || 1).fill(false));
    if (selectedImageIndex >= (imgs?.length || 0)) setSelectedImageIndex(0);
  }, [selectedVariant, product]);

  useEffect(() => { setZoomPosition({ x: 50, y: 50 }); }, [selectedImageIndex, selectedVariant]);
  useEffect(() => { return () => { setIsZoomActive(false); }; }, []);

  /* ── Helpers ───────────────────────────────────────────────────────────── */
  const getCurrentStock = () => selectedVariant ? selectedVariant.stock || 0 : product?.stock || 0;
  const getCurrentPrice = () => selectedVariant ? selectedVariant.calculatedPrice || 0 : parseFloat(product?.price || "0");
  const getOriginalPrice = () => selectedVariant ? selectedVariant.originalPrice || selectedVariant.calculatedPrice || 0 : parseFloat(product?.originalPrice || product?.price || "0");
  const handleVariantSelect = (variant: any) => { setSelectedVariant(variant); setSelectedImageIndex(0); };

  const handleMouseEnter = () => { const imgs = getCurrentImages(); if (imgs[selectedImageIndex] && !imageError[selectedImageIndex]) setIsZoomActive(true); };
  const handleMouseLeave = () => setIsZoomActive(false);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomActive || !mainImageRef.current) return;
    const rect = mainImageRef.current.getBoundingClientRect();
    setZoomPosition({ x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)), y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)) });
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) { setAuthModalOpen(true); return; }
    if (!product) return;
    handleCartOnAdd({ ...product, category: typeof product.category === 'object' ? product.category?.name : product.category } as any, quantity, selectedVariant?.id);
  };

  const handleAddToWishlist = async () => {
    if (!isAuthenticated || !product) { setAuthModalOpen(true); return; }
    try { await addToWishlist(product.id, selectedVariant?.id || undefined, token || undefined); toast.success("Added to wishlist"); }
    catch (e: unknown) {
      const err = e as any;
      const status = err?.response?.status;
      const msg: string = err?.response?.data?.message || err?.response?.data?.error || err?.message || "";
      if (status === 409 || /already/i.test(msg)) toast("Already present in the wishlist"); else toast.error("Failed to add to wishlist");
    }
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) { setAuthModalOpen(true); return; }
    if (!product) return;
    const data = { product: { ...product, selectedColor, price: getCurrentPrice().toFixed(2), originalPrice: getOriginalPrice() > getCurrentPrice() ? getOriginalPrice().toFixed(2) : undefined, selectedVariant: selectedVariant ? { id: selectedVariant.id, attributes: selectedVariant.attributes, calculatedPrice: selectedVariant.calculatedPrice, originalPrice: selectedVariant.originalPrice, stock: selectedVariant.stock, variantImgUrls: selectedVariant.variantImgUrls } : undefined }, quantity };
    router.push(`/checkout?${new URLSearchParams({ buyNow: 'true', productData: encodeURIComponent(JSON.stringify(data)) }).toString()}`);
  };

  const handleQuantityChange = (increment: boolean) => {
    if (!product) return;
    const stock = getCurrentStock();
    if (increment && quantity < stock) setQuantity(q => q + 1);
    else if (!increment && quantity > 1) setQuantity(q => q - 1);
  };

  const handleVendorClick = () => {
    const vid = product?.vendor?.id;
    if (vid) window.location.href = `/vendor-store/${vid}`;
  };

  /* ── Loading ───────────────────────────────────────────────────────────── */
  if (isProductLoading || isReviewsLoading || !product) {
    return (<><Navbar /><Preloader /><Footer /></>);
  }

  const currentImages = getCurrentImages();
  const currentImage = currentImages[selectedImageIndex] && !imageError[selectedImageIndex] ? currentImages[selectedImageIndex] : "";

  /* ── Variant options renderer ──────────────────────────────────────────── */
  const renderVariants = () => {
    if (!product.hasVariants || !product.variants || product.variants.length <= 1) return null;
    const attributeOptions: Record<string, Set<string>> = {};
    product.variants.forEach((v: any) => {
      if (v.attributes) Object.entries(v.attributes).forEach(([k, val]) => { if (!attributeOptions[k]) attributeOptions[k] = new Set(); attributeOptions[k].add(String(val)); });
    });
    const order = ["color", "size", "length"];
    const types = Object.keys(attributeOptions);
    const ordered = [...order.filter(t => types.includes(t)), ...types.filter(t => !order.includes(t)).sort()];
    const selected = ordered.reduce((acc, k) => { acc[k] = selectedVariant?.attributes?.[k] || ""; return acc; }, {} as Record<string, string>);
    return (
      <div>
        <p className="text-sm font-semibold text-gray-800 mb-2">Available Options:</p>
        <div className="flex flex-col gap-2">
          {ordered.map(attrType => {
            const vals = [...(attributeOptions[attrType] || [])];
            const hasMany = vals.length > 4;
            return (
              <div key={attrType} className="flex items-center gap-3 flex-wrap">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider w-12">{attrType}</span>
                <div className="flex flex-wrap gap-1.5">
                  {vals.map(val => {
                    const isActive = selected[attrType] === val;
                    const sel = { ...selected, [attrType]: val };
                    const match = product.variants.find((v: any) => Object.entries(sel).every(([k, sv]) => v.attributes?.[k] === sv) && v.stock > 0);
                    const oos = !match;
                    return (
                      <button key={val}
                        onClick={() => { if (oos) { toast(`This ${attrType} is out of stock.`); return; } setQuantity(1); handleVariantSelect(match); }}
                        disabled={oos} title={val}
                        className={[
                          "px-3 py-1 rounded-md text-xs font-medium border transition-all",
                          isActive ? "border-orange-500 bg-orange-50 text-orange-600 font-bold" : "border-gray-300 bg-white text-gray-600 hover:border-orange-400 hover:text-orange-500",
                          oos ? "opacity-40 cursor-not-allowed line-through" : "",
                          hasMany ? "px-2 text-[11px]" : "",
                        ].join(" ")}
                      >
                        {val.length > 8 && hasMany ? `${val.substring(0, 6)}...` : val}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ── JSX ───────────────────────────────────────────────────────────────── */
  return (
    <div className="bg-[#f0f2f4] min-h-screen">
      <ScrollToTop />
      <Navbar />

      <main className="bg-[#f0f2f4] pb-12">

        {/* ══════════════════════════════════════════
            TOP PRODUCT SECTION
        ══════════════════════════════════════════ */}
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 pt-8 pb-6">
          <div className="flex flex-col xl:flex-row gap-8 lg:gap-12 items-start bg-white p-6 sm:p-8 rounded-xl shadow-sm">

            {/* ── COLUMN 1: Product Image ── */}
            <div className="w-full xl:w-[450px] flex-shrink-0 flex flex-col gap-3">
              {/* Main image */}
              <div
                ref={mainImageRef}
                className="relative w-full aspect-square rounded-md overflow-hidden bg-gray-100 cursor-crosshair"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onMouseMove={handleMouseMove}
              >
                {currentImage ? (
                  <Image
                    src={currentImage}
                    alt={product.name}
                    fill
                    priority
                    className="object-cover"
                    onError={() => setImageError(prev => { const n = [...prev]; n[selectedImageIndex] = true; return n; })}
                    onLoad={() => setZoomPosition({ x: 50, y: 50 })}
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image available</div>
                )}

                {/* Zoom lens — desktop only */}
                {isZoomActive && currentImage && (
                  <div
                    className="hidden lg:block absolute top-0 z-50 pointer-events-none rounded-xl border border-gray-200 shadow-2xl"
                    style={{
                      left: "calc(100% + 16px)",
                      width: "420px",
                      height: "420px",
                      backgroundImage: `url(${currentImage})`,
                      backgroundSize: `${ZOOM_LEVEL * 100}%`,
                      backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      backgroundRepeat: "no-repeat",
                      backgroundColor: "#fff",
                    }}
                  />
                )}
              </div>

              {/* Thumbnails */}
              {currentImages.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {currentImages.map((img: string, i: number) => (
                    <button key={i} onClick={() => setSelectedImageIndex(i)}
                      className={["w-[68px] h-[68px] rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all", selectedImageIndex === i ? "border-orange-500" : "border-gray-200 hover:border-orange-300"].join(" ")}
                    >
                      {img && !imageError[i] ? (
                        <Image src={img} alt={`view ${i + 1}`} width={72} height={72} className="w-full h-full object-cover"
                          onError={() => setImageError(prev => { const n = [...prev]; n[i] = true; return n; })} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 bg-gray-50">No img</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── COLUMN 2: Product Info ── */}
            <div className="flex-1 w-full min-w-0 flex flex-col gap-4 pt-2">

              {/* Product name */}
              <h1 className="text-[1.5rem] font-bold text-gray-900 leading-snug">
                {product.name}
              </h1>

              {/* Price row */}
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-[1.25rem] font-bold text-[#ea5f0a] leading-none">
                  Rs. {getCurrentPrice().toFixed(2)}
                </span>
                {getOriginalPrice() > getCurrentPrice() && (
                  <>
                    <span className="text-[1rem] text-gray-400 line-through">
                      Rs. {getOriginalPrice().toFixed(2)}
                    </span>
                    <span className="text-[1rem] font-semibold text-green-500">
                      Save Rs. {(getOriginalPrice() - getCurrentPrice()).toFixed(2)}
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="mt-2">
                  <p className="text-[1.1rem] font-medium text-gray-800 mb-2">Description</p>
                  <div
                    className="text-[0.95rem] text-gray-600 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: sanitizeRichText(product.description) }}
                  />
                </div>
              )}

              {/* Variants */}
              {renderVariants()}

              {/* Quantity */}
              <div className="flex flex-col gap-2 mt-2">
                <span className="text-[0.95rem] text-gray-700">Quantity:</span>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden w-fit shadow-sm">
                  <button
                    onClick={() => handleQuantityChange(false)}
                    disabled={quantity <= 1 || getCurrentStock() <= 0}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 text-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
                  >
                    -
                  </button>
                  <input
                    ref={quantityInputRef}
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "") { setQuantity(1); return; }
                      const n = parseInt(v, 10);
                      if (!isNaN(n)) setQuantity(n <= 0 ? 1 : n <= getCurrentStock() ? n : getCurrentStock());
                    }}
                    onBlur={() => { if (quantity < 1) setQuantity(1); }}
                    onClick={() => quantityInputRef.current?.select()}
                    onFocus={() => quantityInputRef.current?.select()}
                    onKeyDown={(e) => { if (["e","E","+","-","."].includes(e.key)) e.preventDefault(); }}
                    min="1" max={getCurrentStock()} disabled={getCurrentStock() <= 0}
                    className="w-14 h-10 text-center text-[0.95rem] font-medium text-gray-900 outline-none  border-x border-gray-100 bg-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => handleQuantityChange(true)}
                    disabled={quantity >= getCurrentStock() || getCurrentStock() <= 0}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 text-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
                  >
                    +
                  </button>
                </div>
                {getCurrentStock() <= 0 && (
                  <span className="text-sm text-red-500 font-medium">ⓘ Out of stock</span>
                )}
              </div>

              {/* ── Action Buttons ── */}
              <div className="flex flex-col gap-3 mt-4">
                {/* Row 1: Add to Cart + Buy Now — side by side */}
                <div className="flex gap-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={getCurrentStock() <= 0}
                    className="flex-1 h-12 bg-[#ea5f0a] hover:bg-[#d65509] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-[1rem] rounded-md transition-colors"
                  >
                    {getCurrentStock() > 0 ? "Add to Cart" : "Out of Stock"}
                  </button>
                  {getCurrentStock() > 0 && (
                    <button
                      onClick={handleBuyNow}
                      className="flex-1 h-12 bg-white border border-[#ea5f0a] text-[#ea5f0a] hover:bg-[#fff7ed] font-bold text-[1rem] rounded-md transition-colors"
                    >
                      Buy Now
                    </button>
                  )}
                </div>

                {/* Row 2: Add to Wishlist — full width, same total width as row above */}
                <button
                  onClick={handleAddToWishlist}
                  className="w-full h-12 bg-white border border-[#ea5f0a] text-[#ea5f0a] hover:bg-[#fff7ed] font-bold text-[1rem] rounded-md transition-colors"
                >
                  Add to Wishlist
                </button>
              </div>
            </div>

            {/* ── COLUMN 3: Seller Information ── */}
            <div className="w-full xl:w-[320px] flex-shrink-0 bg-white border border-gray-200 rounded-xl p-6">

              {/* Heading with orange underline */}
              <div className="border-b-2 border-[#ea5f0a] pb-3 mb-5">
                <h3 className="text-[1.1rem] font-medium text-gray-800">Seller Information</h3>
              </div>

              {/* Vendor profile */}
              <div
                className="flex items-center gap-3 mb-6 cursor-pointer group"
                onClick={handleVendorClick}
              >
                <div className="w-12 h-12 rounded-full bg-[#6b46c1] text-white text-lg font-medium flex items-center justify-center flex-shrink-0">
                  {product.vendor?.businessName?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-[1rem] font-semibold text-gray-900 leading-tight group-hover:text-[#ea5f0a] transition-colors">
                    {product.vendor?.businessName || "Unknown Vendor"}
                  </p>
                  <p className="text-[0.8rem] font-medium text-[#10b981] leading-tight mt-1">Verified Seller</p>
                </div>
              </div>

              {/* Feature list */}
              <div className="flex flex-col gap-5 mb-6">
                {[
                  { icon: <Truck size={20} className="text-[#ea5f0a]" />, title: "Fast Shipping", desc: "14 business days" },
                  { icon: <Undo2 size={20} className="text-[#ea5f0a]" />, title: "Easy Returns", desc: "1 week return policy" },
                  { icon: <ShieldCheck size={20} className="text-[#ea5f0a]" />, title: "Secure Payment", desc: "Protected transactions" },
                  { icon: <Phone size={20} className="text-[#ea5f0a]" />, title: "24/7 Support", desc: "Customer service" },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="flex items-center justify-center flex-shrink-0 mt-0.5">
                      {icon}
                    </div>
                    <div>
                      <p className="text-[0.9rem] font-medium text-gray-900 leading-tight">{title}</p>
                      <p className="text-[0.8rem] text-gray-500 leading-tight mt-1">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Visit Store button */}
              <button
                onClick={handleVendorClick}
                className="w-full h-11 bg-[#ea5f0a] hover:bg-[#d65509] text-white font-medium text-[0.95rem] rounded-md transition-colors mb-5"
              >
                Visit Store
              </button>

              {/* Badge pills */}
              <div className="flex gap-2 flex-wrap justify-between mt-2">
                {[
                  { id: "verified", icon: "✓", text: "Verified", color: "text-gray-700" },
                  { id: "top_rated", icon: "⭐", text: "Top Rated", color: "text-gray-700" },
                  { id: "trusted", icon: "🔒", text: "Trusted", color: "text-gray-700" },
                ].map(({ id, icon, text, color }) => (
                  <span key={id} className={`px-3 py-1 border border-[#ea5f0a]/40 rounded-full text-[0.75rem] font-medium ${color} bg-white flex items-center gap-1`}>
                    <span className="opacity-90">{icon}</span> {text}
                  </span>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            REVIEWS SECTION
        ══════════════════════════════════════════ */}
        <div id="reviews-section" className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 mt-2">
          <div className="bg-white rounded-2xl overflow-hidden">
            <Reviews
              productId={Number(id)}
              initialReviews={reviews}
              initialAverageRating={averageRating}
              totalReviews={totalReviews}
              currentPage={currentReviewPage}
              totalPages={totalPages}
              onReviewUpdate={async () => { localStorage.removeItem(`${CACHE_KEY_REVIEWS}_${id}`); setCurrentReviewPage(1); }}
              onPageChange={(page) => { setCurrentReviewPage(page); document.getElementById("reviews-section")?.scrollIntoView({ behavior: "smooth" }); }}
            />
          </div>
        </div>

        {/* ══════════════════════════════════════════
            RECOMMENDED PRODUCTS
        ══════════════════════════════════════════ */}
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 mt-6">
          <RecommendedProducts
            products={recommendedProducts ?? []}
            currentProductId={product.id}
            {...(effectiveCategoryId ? { fallbackCategoryId: effectiveCategoryId } : {})}
            {...(effectiveSubcategoryId ? { fallbackSubcategoryId: effectiveSubcategoryId } : {})}
            isLoading={isLoadingRecommended}
          />
        </div>
      </main>

      {authModalOpen && <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />}
      <Footer />
    </div>
  );
};

export default ProductPage;