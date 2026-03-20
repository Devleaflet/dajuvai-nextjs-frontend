'use client';

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axiosInstance from "@/lib/api/axiosInstance";
import ProductCard from "@/components/Components/ProductCard";
import "@/styles/VendorStore.css";
import Navbar from "@/components/Components/Navbar";
import Footer from "@/components/Components/Footer";
import { Product as DisplayProduct } from "@/components/Components/Types/Product";
import { FiMail, FiPhone, FiMapPin, FiSearch } from "react-icons/fi";

interface ApiProduct {
	id: number;
	name: string;
	description: string | null;
	basePrice: string | null;
	finalPrice?: string | null;
	stock: number | null;
	discount: string;
	discountType: string;
	size?: string[];
	productImages: Array<string | { url?: string; image?: string }>;
	status: string;
	vendorId: number;
	subcategoryId?: number;
	hasVariants?: boolean;
	variants?: Array<{
		id?: number;
		sku: string;
		basePrice?: string | number;
		finalPrice?: string | number;
		price?: string | number;
		discount?: string | number;
		discountType?: string;
		attributes?: Record<string, any> | Array<any>;
		variantImages?: Array<string | { url?: string; image?: string }>;
		images?: Array<string | { url?: string; image?: string }>;
		stock: number | null;
	}>;
	subcategory?: {
		id: number;
		name: string;
	};
	vendor?: {
		id: number;
		businessName: string;
		email: string;

		districtId: number;
		district: {
			id: number;
			name: string;
		};
	};
}

interface VendorInfo {
	id?: number;
	businessName: string;
	email?: string;
	phoneNumber?: string;
	districtName?: string;
	description?: string;
	profilePicture?: string;
}

interface VendorStoreResponse {
	success: boolean;
	data: {
		product?: ApiProduct[];
		products?: ApiProduct[];
		total: number;
	};
}

const VendorStore: React.FC = () => {
	const { vendorId } = useParams<{ vendorId: string }>();
	const [vendorProducts, setVendorProducts] = useState<DisplayProduct[]>([]);
	const [totalProducts, setTotalProducts] = useState<number>(0);
	const [loading, setLoading] = useState<boolean>(true);
	const [page, setPage] = useState<number>(1);
	const [limit] = useState<number>(10);
	const [vendorInfo, setVendorInfo] = useState<VendorInfo | null>(null);
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [sortBy, setSortBy] = useState<
		"relevance" | "price_asc" | "price_desc" | "name_asc" | "name_desc"
	>("relevance");
	const resolvedVendorId = Array.isArray(vendorId) ? vendorId[0] : vendorId;

	useEffect(() => {
		let isMounted = true;

		const normalizeVendor = (v: any): VendorInfo => ({
			id: v?.id,
			businessName: v?.businessName || v?.name || "Unknown Vendor",
			email: v?.email,
			phoneNumber: v?.phoneNumber,
			districtName: v?.district?.name || v?.districtName,
			description: v?.description || v?.about || v?.bio,
			profilePicture: v?.profilePicture,
		});

		const getImageUrl = (img: any): string => {
			if (!img) return "";
			if (typeof img === "string") return img;
			if (typeof img === "object") return img.url || img.image || "";
			return "";
		};

		const normalizeVariantAttributes = (attrs: any): Record<string, string> => {
			if (!attrs) return {};
			if (!Array.isArray(attrs) && typeof attrs === "object") {
				return Object.entries(attrs).reduce((acc, [k, v]) => {
					if (v !== undefined && v !== null && String(v).trim() !== "") {
						acc[String(k).toLowerCase()] = String(v);
					}
					return acc;
				}, {} as Record<string, string>);
			}
			if (!Array.isArray(attrs)) return {};
			const out: Record<string, string> = {};
			attrs.forEach((a) => {
				const key = (a?.attributeType || a?.name || "").toLowerCase();
				const val = Array.isArray(a?.attributeValues)
					? a.attributeValues[0]
					: a?.value || a?.attributeValue;
				if (key && val) out[key] = val;
			});
			return out;
		};

		const fetchVendorData = async () => {
			if (!resolvedVendorId) {
				setLoading(false);
				return;
			}

			try {
				setLoading(true);

				const [productsResult, vendorResult] = await Promise.allSettled([
					axiosInstance.get<VendorStoreResponse>(
						`/api/vendors/${resolvedVendorId}/products?page=${page}&limit=${limit}`
					),
					axiosInstance.get(`/api/vendors/${resolvedVendorId}`),
				]);

				if (!isMounted) return;

				let vData: unknown = null;
				if (vendorResult.status === "fulfilled") {
					vData =
						vendorResult.value?.data?.data ||
						vendorResult.value?.data?.vendor ||
						vendorResult.value?.data;
					if (vData) setVendorInfo(normalizeVendor(vData));
				} else {
					console.warn("Vendor details API failed", vendorResult.reason);
				}

				if (
					productsResult.status === "fulfilled" &&
					productsResult.value.data.success
				) {
					const products =
						productsResult.value.data.data.product ||
						productsResult.value.data.data.products ||
						[];

					// Fallback vendor info from products if vendor API missing
					if (!vData && products && products.length > 0 && products[0]?.vendor) {
						setVendorInfo(normalizeVendor(products[0].vendor));
					}

					const transformedProducts: DisplayProduct[] = products.map((product) => {
						const hasBase = product.basePrice !== null && product.basePrice !== undefined;
						const basePrice = hasBase ? parseFloat(String(product.basePrice)) : NaN;
						const finalPrice = parseFloat(String(product.finalPrice ?? ""));
						const discount = parseFloat(String(product.discount || "0"));
						let priceNum = isFinite(finalPrice)
							? finalPrice
							: hasBase && isFinite(basePrice)
								? basePrice
								: 0;
						let originalPrice: string | undefined = undefined;
						const discountType = (product.discountType || "").toUpperCase();
						if (
							hasBase &&
							isFinite(basePrice) &&
							(discount > 0 || (isFinite(finalPrice) && finalPrice < basePrice)) &&
							(discountType === "PERCENTAGE" ||
								discountType === "FLAT" ||
								discountType === "FIXED")
						) {
							if (!isFinite(finalPrice)) {
								if (discountType === "PERCENTAGE") {
									priceNum = basePrice - (basePrice * discount) / 100;
									originalPrice = basePrice.toFixed(2);
								} else if (discountType === "FLAT" || discountType === "FIXED") {
									priceNum = basePrice - discount;
									originalPrice = basePrice.toFixed(2);
								}
							} else if (finalPrice < basePrice) {
								originalPrice = basePrice.toFixed(2);
							}
						}

						const variants = (product.variants || []).map((v: any) => {
							const vBase = v.basePrice ?? v.price;
							const vFinal = v.finalPrice;
							const vDiscount = v.discount ?? product.discount;
							const vDiscountType = (v.discountType || product.discountType || "").toUpperCase();
							let vPriceNum = vFinal ? parseFloat(String(vFinal)) : vBase ? parseFloat(String(vBase)) : 0;
							if (vPriceNum && vDiscount && vDiscountType === "PERCENTAGE") {
								vPriceNum = vPriceNum - (vPriceNum * parseFloat(String(vDiscount))) / 100;
							} else if (vPriceNum && vDiscount && (vDiscountType === "FLAT" || vDiscountType === "FIXED")) {
								vPriceNum = vPriceNum - parseFloat(String(vDiscount));
							}

							return {
								id: v.id || v.sku,
								sku: v.sku,
								basePrice: vBase,
								discount: vDiscount,
								discountType: vDiscountType,
								images: (v.variantImages || v.images || []).map(getImageUrl).filter(Boolean),
								stock: v.stock ?? 0,
								attributes: normalizeVariantAttributes(v.attributes),
								price: vPriceNum,
							};
						});

						const productImages = (product.productImages || []).map(getImageUrl).filter(Boolean);
						const firstVariantImg = variants[0]?.images?.[0];

						return {
							id: product.id,
							title: product.name,
							name: product.name,
							description: product.description || "",
							price: priceNum > 0 ? priceNum.toFixed(2) : 0,
							originalPrice: originalPrice,
							discount: discount > 0 ? String(product.discount) : undefined,
							rating: Number((product as any).avgRating ?? (product as any).rating ?? 0) || 0,
							ratingCount: String(
								(Array.isArray((product as any).reviews)
									? (product as any).reviews.length
									: undefined) ??
								(product as any).count ??
								(product as any).ratingCount ??
								0
							),
							isBestSeller: false,
							freeDelivery: false,
							category: product.subcategory?.name || "",
							subcategory: product.subcategory
								? { id: product.subcategory.id, name: product.subcategory.name }
								: product.subcategoryId
									? { id: product.subcategoryId, name: "Subcategory" }
								: undefined,
							image: productImages[0] || firstVariantImg || "/assets/logo.webp",
							vendor: product.vendor?.businessName || "Unknown Vendor",
							vendorId: product.vendorId,
							productImages,
							variants,
							basePrice: product.basePrice || undefined,
							discountType: (product.discountType || "").toUpperCase() as any,
							colors: [],
							memoryOptions: product.size || [],
							stock: product.stock ?? 0,
							piece: product.stock ?? 0,
						};
					});
					setVendorProducts(transformedProducts);
					setTotalProducts(productsResult.value.data.data.total);
				} else {
					console.error(
						"Vendor products API failed",
						productsResult.status === "rejected" ? productsResult.reason : productsResult.value.data
					);
					setVendorProducts([]);
					setTotalProducts(0);
				}
			} catch (error) {
				if (!isMounted) return;
				console.error("Error fetching vendor page data:", error);
				setVendorProducts([]);
			} finally {
				if (isMounted) setLoading(false);
			}
		};

		fetchVendorData();

		return () => {
			isMounted = false;
		};
	}, [resolvedVendorId, page, limit]);

	const handlePageChange = (newPage: number) => {
		if (newPage > 0 && newPage <= Math.ceil(totalProducts / limit)) {
			setPage(newPage);
		}
	};

	const filteredProducts = vendorProducts.filter((p) => {
		const q = searchTerm.trim().toLowerCase();
		if (!q) return true;
		const title = (p.title || p.name || "").toLowerCase();
		const desc = (p.description || "").toLowerCase();
		return title.includes(q) || desc.includes(q);
	});

	// Helper to compute effective price similar to ProductCard
	const toNumber = (v: any): number => {
		if (v === undefined || v === null) return 0;
		const n = typeof v === "string" ? parseFloat(v) : Number(v);
		return isFinite(n) ? n : 0;
	};
	const calcPrice = (base: any, disc?: any, discType?: string): number => {
		const baseNum = toNumber(base);
		if (!disc || !discType) return baseNum;
		const d = typeof disc === "string" ? parseFloat(disc) : Number(disc);
		if (!isFinite(d)) return baseNum;
		const t = String(discType).toUpperCase();
		if (t === "PERCENTAGE") return baseNum * (1 - d / 100);
		if (t === "FIXED" || t === "FLAT") return baseNum - d;
		return baseNum;
	};
	// Compute the minimum effective price across all variants, falling back to product/base price
	const getMinVariantPrice = (p: DisplayProduct): number => {
		const variants = (p as any).variants || [];
		if (!variants || variants.length === 0) return Number.POSITIVE_INFINITY;
		const prodBase = (p as any).basePrice ?? (p as any).price;
		const prodDisc = (p as any).discount;
		const prodDiscType = (p as any).discountType;
		let minPrice = Number.POSITIVE_INFINITY;
		for (const v of variants as any[]) {
			const base = v.basePrice ?? v.originalPrice ?? prodBase;
			let eff = toNumber(base);
			if (v.discount && v.discountType)
				eff = calcPrice(base, v.discount, v.discountType);
			else if (prodDisc && prodDiscType)
				eff = calcPrice(base, prodDisc, prodDiscType);
			if (eff < minPrice) minPrice = eff;
		}
		return isFinite(minPrice) ? minPrice : Number.POSITIVE_INFINITY;
	};

	const getEffectivePrice = (p: DisplayProduct): number => {
		const productPriceNum = toNumber((p as any).price);
		const minVar = getMinVariantPrice(p);
		if (isFinite(minVar)) {
			// If product has its own price, sort by the lower of product vs min variant for intuitiveness
			return productPriceNum > 0 ? Math.min(productPriceNum, minVar) : minVar;
		}
		return productPriceNum;
	};

	const query = searchTerm.trim().toLowerCase();
	const relevanceScore = (p: DisplayProduct): number => {
		if (!query) return 0;
		const title = (p.title || p.name || "").toLowerCase();
		const desc = (p.description || "").toLowerCase();
		let score = 0;
		if (title.startsWith(query)) score += 5;
		if (title.includes(query)) score += 3;
		if (desc.includes(query)) score += 1;
		return score;
	};

	const sortedProducts = [...filteredProducts].sort((a, b) => {
		switch (sortBy) {
			case "price_asc":
				return getEffectivePrice(a) - getEffectivePrice(b);
			case "price_desc":
				return getEffectivePrice(b) - getEffectivePrice(a);
			case "name_asc":
				return (a.title || a.name || "").localeCompare(b.title || b.name || "");
			case "name_desc":
				return (b.title || b.name || "").localeCompare(a.title || a.name || "");
			case "relevance":
			default:
				// When searching, sort by a simple relevance score (desc). If no query, keep original order.
				if (!query) return 0;
				return relevanceScore(b) - relevanceScore(a);
		}
	});

	// VendorStore Skeleton Loader
	const VendorStoreSkeleton: React.FC = () => (
		<>
			<div className="vendor-store__header">
				<div
					className="vendor-store__logo shimmer"
					style={{ width: "4rem", height: "4rem", borderRadius: "50%" }}
				></div>
				<div className="vendor-store__info">
					<div
						className="shimmer"
						style={{
							width: "10rem",
							height: "1.2rem",
							borderRadius: "0.4rem",
							marginBottom: "0.5rem",
						}}
					></div>
					<div
						className="shimmer"
						style={{ width: "16rem", height: "0.9rem", borderRadius: "0.4rem" }}
					></div>
				</div>
			</div>
			<aside className="vendor-store__details">
				<div
					className="shimmer"
					style={{
						width: "7rem",
						height: "1rem",
						borderRadius: "0.3rem",
						marginBottom: "0.7rem",
					}}
				></div>
				<div
					className="shimmer"
					style={{
						width: "12rem",
						height: "0.9rem",
						borderRadius: "0.3rem",
						marginBottom: "0.5rem",
					}}
				></div>
				<div
					className="shimmer"
					style={{
						width: "10rem",
						height: "0.9rem",
						borderRadius: "0.3rem",
						marginBottom: "0.5rem",
					}}
				></div>
				<div
					className="shimmer"
					style={{ width: "8rem", height: "0.9rem", borderRadius: "0.3rem" }}
				></div>
			</aside>
			<main className="vendor-store__products">
				<div className="products-header">
					<div
						className="shimmer"
						style={{
							width: "8rem",
							height: "1.1rem",
							borderRadius: "0.3rem",
							marginBottom: "1rem",
						}}
					></div>
				</div>
				<div className="vendor-store__product-grid">
					{[...Array(8)].map((_, i) => (
						<div
							key={i}
							className="shimmer"
							style={{
								height: "220px",
								borderRadius: "0.7rem",
								marginBottom: "1rem",
							}}
						></div>
					))}
				</div>
			</main>
		</>
	);

	if (loading) {
		return <VendorStoreSkeleton />;
	}

	return (
		<>
			<Navbar />
			<div className="vendor-store">
				<header className="vendor-store__header">
					<div className="vendor-store__logo">
						{vendorInfo?.profilePicture ? (
							<img
								src={vendorInfo.profilePicture}
								alt={vendorInfo.businessName}
								className="vendor-store__logo-image"
							/>
						) : (
							<span className="vendor-store__logo-letter">
								{vendorInfo?.businessName?.[0]?.toUpperCase() || "U"}
							</span>
						)}
					</div>
					<div className="vendor-store__info">
						<h1>{vendorInfo?.businessName || "Unknown Vendor"}</h1>
						<p className="vendor-store__description">
							{vendorInfo?.description || "A trusted vendor offering quality products."}
						</p>
					</div>
					<div className="vendor-hero__chips">
						{vendorInfo?.email && (
							<div
								className="vendor-hero__chip"
								title={vendorInfo.email}
							>
								<FiMail className="chip-icon" />
								<span className="chip-text">{vendorInfo.email}</span>
							</div>
						)}

						{vendorInfo?.phoneNumber && (
							<div
								className="vendor-hero__chip"
								title={vendorInfo.phoneNumber}
							>
								<FiPhone className="chip-icon" />
								<span className="chip-text">{vendorInfo.phoneNumber}</span>
							</div>
						)}

						{vendorInfo?.districtName && (
							<div
								className="vendor-hero__chip"
								title={vendorInfo.districtName}
							>
								<FiMapPin className="chip-icon" />
								<span className="chip-text">{vendorInfo.districtName}</span>
							</div>
						)}
					</div>
				</header>

				<div className="vendor-store__content">
					<aside className="vendor-store__details">
						<h2 className="vendor-details__title">Vendor Details</h2>
						<div className="vendor-details__item">
							<div className="vendor-detail-row">
								<FiMail className="vendor-detail-icon" />
								<div>
									<strong>Email:</strong>{" "}
									<span>{vendorInfo?.email || "N/A"}</span>
								</div>
							</div>
						</div>

						{vendorInfo?.phoneNumber && (
							<div className="vendor-details__item">
								<div className="vendor-detail-row">
									<FiPhone className="vendor-detail-icon" />
									<div>
										<strong>Phone:</strong>{" "}
										<span>{vendorInfo.phoneNumber}</span>
									</div>
								</div>
							</div>
						)}

						<div className="vendor-details__item">
							<div className="vendor-detail-row">
								<FiMapPin className="vendor-detail-icon" />
								<div>
									<strong>District:</strong>{" "}
									<span>{vendorInfo?.districtName || "N/A"}</span>
								</div>
							</div>
						</div>
					</aside>

					<main className="vendor-store__products">
						<div className="products-header">
							<h2 className="products-title">
								Products ({sortedProducts.length})
							</h2>
						</div>

						<div className="products-controls">
							<div
								className="products-toolbar"
								role="search"
							>
								<form
									className="vendor-search"
									onSubmit={(e) => {
										e.preventDefault();
									}}
									aria-label="Search vendor products"
								>
									<div className="vendor-search__input-wrapper">
										<FiSearch className="vendor-search__icon" />
										<input
											type="text"
											className="vendor-search__input "
											placeholder="Search products..."
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											style={{
												outline: "none",
											}}
										/>
									</div>
								</form>
							</div>
							<div
								className="vendor-sort"
								aria-label="Sort products"
							>
								<select
									className="vendor-sort__select"
									value={sortBy}
									onChange={(e) => setSortBy(e.target.value as any)}
								>
									<option value="relevance">Sort: Relevance</option>
									<option value="price_asc">Price: Low to High</option>
									<option value="price_desc">Price: High to Low</option>
									<option value="name_asc">Name: A to Z</option>
									<option value="name_desc">Name: Z to A</option>
								</select>
							</div>
						</div>

						{sortedProducts.length > 0 ? (
							<div className="vendor-store__product-grid">
								{sortedProducts.map((product) => (
									<ProductCard
										key={product.id}
										product={product}
									/>
								))}
							</div>
						) : (
							<div className="no-products">
								<p>No products match your search.</p>
							</div>
						)}

						{totalProducts > limit && (
							<div className="vendor-store__pagination">
								<button
									onClick={() => handlePageChange(page - 1)}
									disabled={page === 1}
									className="pagination-button"
								>
									Previous
								</button>
								<span className="pagination-info">
									Page {page} of {Math.ceil(totalProducts / limit)}
								</span>
								<button
									onClick={() => handlePageChange(page + 1)}
									disabled={page === Math.ceil(totalProducts / limit)}
									className="pagination-button"
								>
									Next
								</button>
							</div>
						)}
					</main>
				</div>
			</div>
			<Footer />
		</>
	);
};

export default VendorStore;
