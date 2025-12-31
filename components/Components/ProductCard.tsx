'use client';

import { Product } from "./Types/Product";
import { useCart } from "@/lib/context/CartContext";
import { useAuth } from "@/lib/context/AuthContext";
import { useUI } from "@/lib/context/UIContext";
import { addToWishlist, removeFromWishlist } from "@/lib/api/wishlist";
import { useWishlist } from "@/lib/context/WishlistContext";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { getProductPrimaryImage } from "@/lib/utils/getProductPrimaryImage";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "@/lib/config";
import { calculateDiscountedPrice } from "@/lib/utils/pricing";
import ProductImageGallery from "@/components/features/ProductImageGallery";
import ProductInfo from "@/components/features/ProductInfo";
import ProductActions from "@/components/features/ProductActions";
import '@/styles/ProductCard.css';

const AuthModal = dynamic(() => import("./AuthModal"), {
	ssr: false
});
interface ProductCardProps {
	product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
	const { handleCartOnAdd } = useCart();
	const { token, isAuthenticated } = useAuth();
	const { wishlist, refreshWishlist } = useWishlist();
	const { cartOpen } = useUI();
	const [wishlistLoading, setWishlistLoading] = useState(false);
	const [authModalOpen, setAuthModalOpen] = useState(false);
	const [isWishlisted, setIsWishlisted] = useState(false);
	const [wishlistItemId, setWishlistItemId] = useState<number | null>(null);

	const router = useRouter();
	const {
		title,
		description,
		rating,
		ratingCount,
		isBestSeller,
		id,
	} = product;

	useEffect(() => {
		if (isAuthenticated && token) {
			const variantCount = product.variants?.length || 0;
			const variantId = variantCount > 0 && product.variants?.[0] ? product.variants[0].id : undefined;
			const wishlistItem = wishlist.find((item: any) => {
				const productMatch = item.productId === id || item.product?.id === id;
				const variantMatch = variantId
					? item.variantId === variantId || item.variant?.id === variantId
					: !item.variantId && !item.variant?.id;
				return productMatch && variantMatch;
			});
			if (wishlistItem) {
				setIsWishlisted(true);
				setWishlistItemId(wishlistItem.id);
			} else {
				setIsWishlisted(false);
				setWishlistItemId(null);
			}
		} else {
			setIsWishlisted(false);
			setWishlistItemId(null);
		}
	}, [wishlist, id, product.variants, isAuthenticated, token]);

	// Memoize product images array
	const productImages = useMemo(() => {
		const images: string[] = [];

		try {
			const variantsArray: any[] = Array.isArray(product?.variants)
				? product.variants
				: [];

			// Process variants in order (position first, then id)
			if (variantsArray.length > 0) {
				const orderedVariants = [...variantsArray].sort((a: any, b: any) => {
					const ap = Number(a?.position);
					const bp = Number(b?.position);
					if (Number.isFinite(ap) && Number.isFinite(bp)) return ap - bp;
					const aid = Number(a?.id);
					const bid = Number(b?.id);
					if (Number.isFinite(aid) && Number.isFinite(bid)) return aid - bid;
					return 0;
				});

				orderedVariants.forEach((variant) => {
					// Process image URL helper
					const processImageUrl = (imgUrl: string): string => {
						if (!imgUrl) return "";
						const trimmed = imgUrl.trim();
						if (!trimmed) return "";
						if (trimmed.startsWith("//")) return `https:${trimmed}`;
						if (
							trimmed.startsWith("http://") ||
							trimmed.startsWith("https://") ||
							trimmed.startsWith("/")
						) {
							return trimmed;
						}
						const base = API_BASE_URL.replace(/\/?api\/?$/, "");
						const needsSlash = !trimmed.startsWith("/");
						const url = `${base}${needsSlash ? "/" : ""}${trimmed}`;
						return url.replace(/([^:]\/)\/+/, "$1/");
					};

					// Add variant.image
					if (typeof variant?.image === "string" && variant.image.trim()) {
						const url = processImageUrl(variant.image);
						if (url && !images.includes(url)) {
							images.push(url);
						}
					}

					// Add variant.images array
					if (Array.isArray(variant?.images)) {
						variant.images.forEach((img: any) => {
							if (typeof img === "string" && img.trim()) {
								const url = processImageUrl(img);
								if (url && !images.includes(url)) {
									images.push(url);
								}
							}
						});
					}

					// Add variant.variantImages array
					if (Array.isArray(variant?.variantImages)) {
						variant.variantImages.forEach((img: any) => {
							if (typeof img === "string" && img.trim()) {
								const url = processImageUrl(img);
								if (url && !images.includes(url)) {
									images.push(url);
								}
							}
						});
					}
				});
			}

			// Process image URL helper (defined here for product images)
			const processImageUrl = (imgUrl: string): string => {
				if (!imgUrl) return "";
				const trimmed = imgUrl.trim();
				if (!trimmed) return "";
				if (trimmed.startsWith("//")) return `https:${trimmed}`;
				if (
					trimmed.startsWith("http://") ||
					trimmed.startsWith("https://") ||
					trimmed.startsWith("/")
				) {
					return trimmed;
				}
				const base = API_BASE_URL.replace(/\/?api\/?$/, "");
				const needsSlash = !trimmed.startsWith("/");
				const url = `${base}${needsSlash ? "/" : ""}${trimmed}`;
				return url.replace(/([^:]\/)\/+/, "$1/");
			};

			// Add product.productImages array
			if (Array.isArray(product?.productImages)) {
				product.productImages.forEach((img: any) => {
					if (typeof img === "string" && img.trim()) {
						const url = processImageUrl(img);
						if (url && !images.includes(url)) {
							images.push(url);
						}
					}
				});
			}

			// Add main product.image
			if (typeof product?.image === "string" && product.image.trim()) {
				const url = processImageUrl(product.image);
				if (url && !images.includes(url)) {
					images.push(url);
				}
			}

			// If no images found, use the primary image from utility function
			if (images.length === 0) {
				const primaryImage = getProductPrimaryImage(
					product,
					"/assets/logo.webp"
				);
				if (primaryImage && primaryImage !== "/assets/logo.webp") {
					images.push(primaryImage);
				}
			}
		} catch (e) {
			console.warn("Error processing product images:", e);
		}

		// Ensure we have at least one image
		return images.length > 0 ? images : ["/assets/logo.webp"];
	}, [product]);

	// Memoize pricing calculation
	const pricing = useMemo(() => {
		// Get base price from variant (if exists) or product
		let baseNum = 0;
		if (product.variants && product.variants.length > 0) {
			// Use first variant's basePrice
			const variantBase = product.variants[0]?.['basePrice'];
			baseNum = typeof variantBase === "string" ? parseFloat(variantBase) : Number(variantBase) || 0;
		} else {
			// Use product's basePrice or price
			const productBase = product['basePrice'] ?? product.price;
			baseNum = typeof productBase === "string" ? parseFloat(productBase) : Number(productBase) || 0;
		}

		// Apply product-level discount to the base price
		const productDiscount = Number(product.discount) || 0;
		const productDiscountType = product.discountType;

		return calculateDiscountedPrice(baseNum, productDiscount, productDiscountType);
	}, [product.variants, product, product.price, product.discount, product.discountType]);

	// Memoize card click handler
	const handleCardClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		const target = e.target as HTMLElement;

		if (
			target.closest(".product-card__wishlist-button") ||
			target.closest(".product-card__cart-button") ||
			target.closest(".product-card__dot")
		) {
			return;
		}

		// Navigate to product page
		router.push(`/product-page/${product.id}`);

		// Force scroll to top on next tick
		setTimeout(() => {
			window.scrollTo(0, 0);
		}, 0);

		// Extra insurance: also after a tiny delay
		setTimeout(() => {
			window.scrollTo(0, 0);
		}, 100);
	}, [product.id, router]);
	// Memoize wishlist handler
	const handleWishlist = useCallback(async () => {
		if (!isAuthenticated) {
			setAuthModalOpen(true);
			return;
		}

		setWishlistLoading(true);
		try {
			const variantCount = product.variants?.length || 0;
			const variantId = variantCount > 0 && product.variants?.[0] ? product.variants[0].id : undefined;

			if (isWishlisted && wishlistItemId) {
				await removeFromWishlist(wishlistItemId, token || undefined);
				toast.success("Removed from wishlist");
				setIsWishlisted(false);
				setWishlistItemId(null);
				await refreshWishlist();
			} else {
				const addedItem = await addToWishlist(id, variantId, token || undefined);
				toast.success("Added to wishlist");
				setIsWishlisted(true);
				setWishlistItemId(addedItem?.id || null);
				await refreshWishlist();
			}
		} catch (e: unknown) {
			const status = (e as any)?.response?.status;
			const msg: string =
				(e as any)?.response?.data?.message ||
				(e as any)?.response?.data?.error ||
				(e as any)?.message ||
				"";

			if (status === 409 || /already/i.test(msg)) {
				toast("Already present in the wishlist");
				setIsWishlisted(true);
				if (!wishlistItemId) {
					await refreshWishlist();
				}
			} else {
				toast.error(
					isWishlisted
						? "Failed to remove from wishlist"
						: "Failed to add to wishlist"
				);
				console.error("Wishlist operation failed:", e);
			}
		} finally {
			setWishlistLoading(false);
		}
	}, [isAuthenticated, product.variants, isWishlisted, wishlistItemId, token, id, refreshWishlist]);

	// Memoize add to cart handler
	const handleAddToCart = useCallback(() => {
		if (!isAuthenticated) {
			setAuthModalOpen(true);
			return;
		}
		const variantCount = product.variants?.length || 0;
		const variantId = variantCount > 0 && product.variants?.[0] ? product.variants[0].id : undefined;
		handleCartOnAdd(product, 1, variantId);
	}, [isAuthenticated, product, handleCartOnAdd]);

	return (
		<div
			onClick={handleCardClick}
			className="cursor-pointer no-underline text-inherit"
		>
			<div className="relative z-0 flex-shrink-0 w-60 rounded-lg bg-white shadow-md p-2 transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 h-fit pointer-events-auto">
				<div className="flex justify-between items-center mb-1.5 max-h-2.5">
					{isBestSeller && (
						<span className="bg-gray-700 text-white px-2 py-1 rounded-full text-xs font-medium">Best seller</span>
					)}
				</div>

				<ProductActions
					product={{
						id: product.id,
						...(product.variants && { variants: product.variants.map(v => ({ id: v.id || 0 })) })
					}}
					onAddToCart={handleAddToCart}
					onToggleWishlist={handleWishlist}
					isWishlisted={isWishlisted}
					wishlistLoading={wishlistLoading}
					cartOpen={cartOpen}
				/>

				<ProductImageGallery
					images={productImages}
					alt={title || "Product image"}
				/>

				<ProductInfo
					product={{
						title: title || '',
						description,
						rating: typeof rating === 'number' ? rating : 0,
						ratingCount: typeof ratingCount === 'number' ? ratingCount : 0,
						discount: typeof product.discount === 'number' ? product.discount : 0,
						...(product.vendor && { vendor: product.vendor })
					}}
					pricing={pricing}
				/>
			</div>
			<AuthModal
				isOpen={authModalOpen}
				onClose={(e?: React.MouseEvent) => {
					e?.stopPropagation();
					setAuthModalOpen(false);
				}}
			/>
		</div>
	);
};

export default ProductCard;

