'use client';

import { useQuery } from '@tanstack/react-query';
import { toInteger } from 'lodash';
import { ChevronDown, ChevronUp, Search, X, SlidersHorizontal } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/Components/ProductCard";
import { fetchReviewOf } from "@/lib/api/products";
import CategorySlider from "@/components/Components/CategorySlider";
import Footer from "@/components/Components/Footer";
import Navbar from "@/components/Components/Navbar";
import PageLoader from "@/components/Components/PageLoader";
import type { Product } from "@/components/Components/Types/Product";
import { API_BASE_URL } from "@/lib/config";
import { useAuth } from "@/lib/context/AuthContext";
import CategoryService from "@/lib/services/categoryService";
import ProductCardSkeleton from "@/components/skeleton/ProductCardSkeleton";
import ProductBannerSlider from '@/components/Components/ProductBannerSlider';

// Interfaces
interface Category {
	id: number;
	name: string;
	subcategories: Subcategory[];
}
interface Subcategory {
	id: number;
	name: string;
}
interface ProductFilters {
	categoryId?: number | undefined;
	subcategoryId?: number | undefined;
	brandId?: string | undefined;
	dealId?: string | undefined;
	bannerId?: string | undefined;
	sort?: string | undefined;
	page?: number | undefined;
	limit?: number | undefined;
	search?: string | undefined;
}
interface ApiProduct {
	id: number;
	name: string;
	description: string;
	basePrice: number | null;
	stock: number;
	discount: number | null;
	discountType: 'PERCENTAGE' | 'FLAT' | null;
	size: string[];
	status: 'AVAILABLE' | 'UNAVAILABLE';
	productImages: string[];
	inventory: {
		sku: string;
		quantity: number;
		status: string;
	}[];
	vendorId: number;
	brand_id: number | null;
	dealId: number | null;
	created_at: string;
	updated_at: string;
	categoryId: number;
	variants?: Array<{
		id?: number;
		name?: string;
		price?: number | string;
		originalPrice?: number | string;
		stock?: number;
		sku?: string;
		image?: string;
		images?: string[];
		attributes?: Record<string, any>;
		discount?: number | string;
		discountType?: 'PERCENTAGE' | 'FLAT';
		basePrice?: number | string;
		calculatedPrice?: number;
		[key: string]: any;
	}>;
	subcategory: {
		id: number;
		name: string;
		image: string | null;
		createdAt: string;
		updatedAt: string;
		category?: {
			id: number;
			name: string;
		};
	};
	vendor: {
		id: number;
		businessName: string;
		email: string;
		phoneNumber: string;
		districtId: number;
		isVerified: boolean;
		createdAt: string;
		updatedAt: string;
		district: {
			id: number;
			name: string;
		};
	};
	brand: {
		id: number;
		name: string;
	} | null;
	deal: {
		id: number;
		title: string;
	} | null;
}

// Utility functions
const toNumber = (v: any): number => {
	if (v === undefined || v === null) return 0;
	const n = typeof v === 'string' ? parseFloat(v) : Number(v);
	return isFinite(n) ? n : 0;
};

const calculatePrice = (base: any, disc?: any, discType?: string): number => {
	const baseNum = toNumber(base);
	if (!disc || !discType) return baseNum;
	const d = typeof disc === 'string' ? parseFloat(disc) : Number(disc);
	if (!isFinite(d)) return baseNum;
	if (discType === 'PERCENTAGE') return baseNum * (1 - d / 100);
	if (discType === 'FIXED' || discType === 'FLAT') return baseNum - d;
	return baseNum;
};

const apiRequest = async (
	endpoint: string,
	token: string | null | undefined = undefined
) => {
	const url = endpoint.startsWith('http')
		? endpoint
		: `${API_BASE_URL}${endpoint}`;
	const response = await fetch(url, {
		headers: {
			Authorization: token ? `Bearer ${token}` : '',
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
	});
	if (!response.ok) {
		throw new Error(
			`API request failed: ${response.status} ${response.statusText}`
		);
	}
	const contentType = response.headers.get('content-type');
	if (!contentType || !contentType.includes('application/json')) {
		const textResponse = await response.text();
		if (
			textResponse.trim().startsWith('<!doctype html') ||
			textResponse.trim().startsWith('<html')
		) {
			throw new Error(
				`API endpoint not found. The server returned HTML instead of JSON.`
			);
		}
		throw new Error(`Expected JSON response but received ${contentType}`);
	}
	return await response.json();
};

const buildQueryParams = (filters: ProductFilters): string => {
	const params = new URLSearchParams();
	if (filters.categoryId !== undefined && filters.categoryId !== null) {
		params.append('categoryId', filters.categoryId.toString());
	}
	if (filters.subcategoryId !== undefined && filters.subcategoryId !== null) {
		params.append('subcategoryId', filters.subcategoryId.toString());
	}
	if (filters.brandId !== undefined && filters.brandId !== null) {
		params.append('brandId', filters.brandId);
	}
	if (filters.dealId !== undefined && filters.dealId !== null) {
		params.append('dealId', filters.dealId);
	}
	if (filters.bannerId !== undefined && filters.bannerId !== null) {
		params.append('bannerId', filters.bannerId);
	}
	if (filters.sort !== undefined && filters.sort !== 'all') {
		params.append('sort', filters.sort);
	}
	if (filters.page !== undefined) {
		params.append('page', filters.page.toString());
	}
	if (filters.limit !== undefined) {
		params.append('limit', filters.limit.toString());
	}
	if (filters.search !== undefined) {
		params.append('search', filters.search);
	}
	return params.toString();
};

const fetchProductsWithFilters = async (
	filters: ProductFilters,
	token: string | null | undefined = undefined
) => {
	if (filters.bannerId) {
		const bannerResponse = await apiRequest(
			`/api/banners/${filters.bannerId}`,
			token
		);
		let selectedProducts = bannerResponse?.data?.selectedProducts || [];

		if (filters.search) {
			const query = filters.search.toLowerCase();
			selectedProducts = selectedProducts.filter(
				(item: ApiProduct) =>
					item.name.toLowerCase().includes(query) ||
					item.description.toLowerCase().includes(query) ||
					(item.subcategory?.category?.name || '')
						.toLowerCase()
						.includes(query) ||
					(item.brand?.name || '').toLowerCase().includes(query)
			);
		}

		if (filters.sort && filters.sort !== 'all') {
			selectedProducts = [...selectedProducts].sort((a, b) => {
				const priceA = calculatePrice(a.basePrice, a.discount, a.discountType);
				const priceB = calculatePrice(b.basePrice, b.discount, b.discountType);
				if (filters.sort === 'low-to-high') return priceA - priceB;
				if (filters.sort === 'high-to-low') return priceB - priceA;
				return 0;
			});
		}

		const totalItems = selectedProducts.length;
		const page = filters.page || 1;
		const limit = filters.limit || 40;
		const start = (page - 1) * limit;
		const paginatedProducts = selectedProducts.slice(start, start + limit);

		return {
			success: true,
			data: paginatedProducts,
			pagination: {
				current_page: page,
				total_pages: Math.ceil(totalItems / limit),
				total_items: totalItems,
			},
		};
	}

	const apiFilters = {
		categoryId: filters.categoryId,
		subcategoryId: filters.subcategoryId,
		brandId: filters.brandId,
		dealId: filters.dealId,
		bannerId: filters.bannerId,
		sort: filters.sort,
		page: filters.page,
		limit: filters.limit,
		search: filters.search,
	};

	const queryParams = buildQueryParams(apiFilters);
	const endpoint = `/api/categories/all/products${queryParams ? `?${queryParams}` : ''}`;

	try {
		const response = await apiRequest(endpoint, token);
		return response;
	} catch (error) {
		console.error('❌ Error fetching products:', error);
		throw error;
	}
};

const processProductWithReview = async (item: ApiProduct): Promise<Product> => {
	try {
		const { averageRating, reviews } = await fetchReviewOf(item.id);

		const processImageUrl = (imgUrl: string): string => {
			if (!imgUrl) return '';
			const trimmed = imgUrl.trim();
			if (!trimmed) return '';
			if (trimmed.startsWith('//')) return `https:${trimmed}`;
			if (
				trimmed.startsWith('http://') ||
				trimmed.startsWith('https://') ||
				trimmed.startsWith('/')
			) {
				return trimmed;
			}
			const base = API_BASE_URL.replace(/\/?api\/?$/, '');
			const needsSlash = !trimmed.startsWith('/');
			const url = `${base}${needsSlash ? '/' : ''}${trimmed}`;
			return url.replace(/([^:]\/)\/+/g, '$1/');
		};

		const processedProductImages = (item.productImages || [])
			.filter(
				(img: any): img is string =>
					!!img && typeof img === 'string' && img.trim() !== ''
			)
			.map(processImageUrl)
			.filter(Boolean);

		const processedVariants = (item.variants || []).map((variant) => {
			const rawImages = Array.isArray((variant as any).images)
				? (variant as any).images
				: Array.isArray((variant as any).variantImages)
					? (variant as any).variantImages
					: [];

			const normalizedImages = rawImages
				.filter(
					(img: any): img is string =>
						!!img && typeof img === 'string' && img.trim() !== ''
				)
				.map(processImageUrl)
				.filter(Boolean);

			const primaryImage =
				typeof (variant as any).image === 'string' &&
					(variant as any).image.trim()
					? processImageUrl((variant as any).image)
					: normalizedImages[0] || undefined;

			return {
				...variant,
				image: primaryImage,
				images: normalizedImages,
			};
		});

		const variantImagePool = processedVariants
			.flatMap((v) => [v.image, ...(v.images || [])])
			.filter((x): x is string => typeof x === 'string' && x.length > 0);

		const getDisplayImage = (): string => {
			if (processedProductImages.length > 0) {
				return processedProductImages[0]!;
			}
			const allVariantImages = processedVariants
				.flatMap((v) => [v.image, ...(v.images || [])])
				.filter((x): x is string => typeof x === 'string' && x.length > 0);
			if (allVariantImages.length > 0) return allVariantImages[0]!;
			return '/placeholder-product.png';
		};

		const displayImage = getDisplayImage();

		let displayPriceNum = 0;
		let originalPriceNum = 0;
		const productPriceNum = toNumber(item.basePrice);

		if (
			(item.basePrice === null ||
				item.basePrice === undefined ||
				productPriceNum === 0) &&
			(item.variants?.length || 0) > 0
		) {
			const first = item.variants![0] as any;
			const variantBase = toNumber(
				first?.basePrice ?? first?.price ?? first?.originalPrice ?? 0
			);
			originalPriceNum = variantBase;

			if (item.discount && item.discountType) {
				displayPriceNum = calculatePrice(
					variantBase,
					item.discount,
					String(item.discountType)
				);
			} else {
				displayPriceNum = variantBase;
			}
		} else {
			originalPriceNum = productPriceNum;
			if (item.discount && item.discountType) {
				displayPriceNum = calculatePrice(
					productPriceNum,
					item.discount,
					String(item.discountType)
				);
			} else {
				displayPriceNum = productPriceNum;
			}
		}

		return {
			id: item.id,
			title: item.name as string,
			description: item.description as string,
			originalPrice: originalPriceNum.toString(),
			...(item.discount ? { discount: `${item.discount}` } : {}),
			discountPercentage: item.discount ? `${item.discount}%` : '0%',
			price: displayPriceNum.toString(),
			rating: Number(averageRating) || 0,
			ratingCount: reviews?.length?.toString() || '0',
			isBestSeller: false,
			freeDelivery: true,
			image: displayImage,
			productImages:
				processedProductImages.length > 0
					? processedProductImages
					: variantImagePool.length > 0
						? variantImagePool
						: ['/placeholder-product.png'],
			variants: processedVariants,
			...(item.subcategory?.category?.name ? { category: item.subcategory.category.name } : { category: 'Misc' }),
			...(item.subcategory ? { subcategory: item.subcategory } : {}),
			...(item.brand?.name ? { brand: item.brand.name } : { brand: 'Unknown' }),
			brand_id: item.brand?.id ?? null,
			status: item.status === 'UNAVAILABLE' ? 'OUT_OF_STOCK' : 'AVAILABLE',
			stock: item.stock || 0,
		};
	} catch (error) {
		console.error('Error processing product:', error);
		return {
			id: item.id,
			title: item.name || 'Unknown Product',
			description: item.description || 'No description available',
			originalPrice: '0',
			discountPercentage: item.discount ? `${item.discount}%` : '0%',
			price: '0',
			rating: 0,
			ratingCount: '0',
			isBestSeller: false,
			freeDelivery: true,
			image: '/placeholder-product.png',
			productImages: ['/placeholder-product.png'],
			category: 'Misc',
			brand: 'Unknown',
			brand_id: null,
			status: 'AVAILABLE' as const,
			stock: 0,
		};
	}
};

// ─── Sidebar Filter Panel (shared by desktop sidebar & mobile drawer) ───────
interface FilterPanelProps {
	hasActiveFilters: boolean;
	clearAllFilters: () => void;
	searchQuery: string;
	sortBy: string;
	handleSortChange: (v: string) => void;
	isCategoryDropdownOpen: boolean;
	setIsCategoryDropdownOpen: (v: boolean) => void;
	categorySearch: string;
	setCategorySearch: (v: string) => void;
	isLoadingCategories: boolean;
	categories: Category[];
	selectedCategory: number | undefined;
	handleCategoryChange: (id: number | undefined) => void;
	showMoreCategories: boolean;
	setShowMoreCategories: (v: boolean) => void;
	isSubCategoryDropdownOpen: boolean;
	setIsSubCategoryDropdownOpen: (v: boolean) => void;
	subcategorySearch: string;
	setSubcategorySearch: (v: string) => void;
	isLoadingSubcategories: boolean;
	subcategories: Subcategory[];
	selectedSubcategory: number | undefined;
	handleSubcategoryChange: (id: number | undefined) => void;
	showMoreSubcategories: boolean;
	setShowMoreSubcategories: (v: boolean) => void;
	onClose?: () => void; // for mobile drawer close button
}

const FilterPanel: React.FC<FilterPanelProps> = ({
	hasActiveFilters,
	clearAllFilters,
	searchQuery,
	sortBy,
	handleSortChange,
	isCategoryDropdownOpen,
	setIsCategoryDropdownOpen,
	categorySearch,
	setCategorySearch,
	isLoadingCategories,
	categories,
	selectedCategory,
	handleCategoryChange,
	showMoreCategories,
	setShowMoreCategories,
	isSubCategoryDropdownOpen,
	setIsSubCategoryDropdownOpen,
	subcategorySearch,
	setSubcategorySearch,
	isLoadingSubcategories,
	subcategories,
	selectedSubcategory,
	handleSubcategoryChange,
	showMoreSubcategories,
	setShowMoreSubcategories,
	onClose,
}) => (
	<div className="bg-white rounded-xl shadow-sm p-5 h-full overflow-y-auto">
		{/* Filter Header */}
		<div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
			<h3 className="text-lg font-bold text-gray-800">Filter</h3>
			{/* Close button — only rendered inside mobile drawer */}
			{onClose && (
				<button
					onClick={onClose}
					className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
					aria-label="Close filters"
				>
					<X size={20} className="text-gray-600" />
				</button>
			)}
		</div>

		{/* Clear All Filters */}
		{hasActiveFilters && (
			<div className="mb-4">
				<button
					onClick={clearAllFilters}
					className="w-full py-2 px-4 bg-red-50 text-red-500 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
				>
					Clear All Filters
				</button>
			</div>
		)}

		{/* Active Search Display */}
		{searchQuery.trim() && (
			<div className="mb-4 pb-4 border-b border-gray-100">
				<p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Active Search</p>
				<div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg text-sm text-gray-700">
					<Search size={13} className="text-[#ff6b00] flex-shrink-0" />
					<span className="truncate">"{searchQuery}"</span>
				</div>
			</div>
		)}

		{/* Sort By */}
		<div className="mb-5 pb-5 border-b border-gray-100">
			<h4 className="text-sm font-bold text-gray-700 mb-3">Sort By</h4>
			<div className="flex flex-col gap-2.5">
				{[
					{ value: 'all', label: 'Default' },
					{ value: 'low-to-high', label: 'Price: Low to High' },
					{ value: 'high-to-low', label: 'Price: High to Low' },
				].map((option) => (
					<label key={option.value} className="flex items-center gap-2.5 cursor-pointer group">
						<input
							type="radio"
							name="sort"
							checked={sortBy === option.value}
							onChange={() => handleSortChange(option.value)}
							className="w-4 h-4 cursor-pointer accent-[#a855f7]"
						/>
						<span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
							{option.label}
						</span>
					</label>
				))}
			</div>
		</div>

		{/* Categories */}
		<div className={`${selectedCategory !== undefined ? 'mb-5 pb-5 border-b border-gray-100' : 'mb-0'} `}>
			<button
				className="w-full flex items-center justify-between mb-3 group"
				onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
			>
				<h4 className="text-sm font-bold text-gray-700">Categories</h4>
				<div className={`p-1.5 rounded-md border transition-colors ${isCategoryDropdownOpen ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-200 group-hover:border-gray-300'}`}>
					{isCategoryDropdownOpen ? (
						<ChevronUp size={16} className="text-gray-600" />
					) : (
						<ChevronDown size={16} className="text-gray-600" />
					)}
				</div>
			</button>

			{isCategoryDropdownOpen && (
				<div>
					<input
						type="text"
						placeholder="Search categories..."
						value={categorySearch}
						onChange={(e) => setCategorySearch(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								const match = categories.find((cat: Category) =>
									cat.name.toLowerCase().includes(categorySearch.toLowerCase())
								);
								if (match) handleCategoryChange(match.id);
							}
						}}
						className="w-full py-2 px-3 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#ff6b00] mb-3 bg-gray-50"
					/>
					<div className="flex flex-col gap-2 ">
						{isLoadingCategories ? (
							<p className="text-xs text-gray-400 text-center py-2">Loading...</p>
						) : (
							<>
								<label className="flex items-center gap-2.5 cursor-pointer group">
									<input
										type="radio"
										name="category"
										checked={selectedCategory === undefined}
										onChange={() => handleCategoryChange(undefined)}
										className="w-4 h-4 cursor-pointer accent-[#a855f7]"
									/>
									<span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
										All Categories
									</span>
								</label>
								{categories
									.filter((category: Category) =>
										category.name.toLowerCase().includes(categorySearch.toLowerCase())
									)
									.slice(0, selectedCategory === undefined ? (showMoreCategories ? undefined : 5) : undefined)
									.map((category: Category) => (
										<label key={category.id} className="flex items-center gap-2.5 cursor-pointer group">
											<input
												type="radio"
												name="category"
												checked={selectedCategory === category.id}
												onChange={() => handleCategoryChange(category.id)}
												className="w-4 h-4 cursor-pointer accent-[#a855f7]"
											/>
											<span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
												{category.name}
											</span>
										</label>
									))}
								{selectedCategory === undefined && categories.length > 5 && (
									<button
										onClick={() => setShowMoreCategories(!showMoreCategories)}
										className="mt-1 text-[#ff6b00] text-xs font-medium hover:underline text-left"
									>
										{showMoreCategories ? 'View Less ↑' : 'View More ↓'}
									</button>
								)}
							</>
						)}
					</div>
				</div>
			)}
		</div>

		{/* Subcategories */}
		{selectedCategory !== undefined && (
			<div>
				<button
					className="w-full flex items-center justify-between mb-3"
					onClick={() => setIsSubCategoryDropdownOpen(!isSubCategoryDropdownOpen)}
				>
					<h4 className="text-sm font-bold text-gray-700">Subcategories</h4>
					{isSubCategoryDropdownOpen ? (
						<ChevronUp size={16} className="text-gray-500" />
					) : (
						<ChevronDown size={16} className="text-gray-500" />
					)}
				</button>

				{isSubCategoryDropdownOpen && (
					<div>
						<input
							type="text"
							placeholder="Search subcategories..."
							value={subcategorySearch}
							onChange={(e) => setSubcategorySearch(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									const match = subcategories.find((sub: Subcategory) =>
										sub.name.toLowerCase().includes(subcategorySearch.toLowerCase())
									);
									if (match) handleSubcategoryChange(match.id);
								}
							}}
							className="w-full py-2 px-3 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#ff6b00] mb-3 bg-gray-50"
						/>
						<div className="flex flex-col gap-2">
							{isLoadingSubcategories ? (
								<p className="text-xs text-gray-400 text-center py-2">Loading...</p>
							) : subcategories.length > 0 ? (
								<>
									<label className="flex items-center gap-2.5 cursor-pointer group">
										<input
											type="radio"
											name="subcategory"
											checked={selectedSubcategory === undefined}
											onChange={() => handleSubcategoryChange(undefined)}
											className="w-4 h-4 cursor-pointer accent-[#a855f7]"
										/>
										<span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
											All Subcategories
										</span>
									</label>
									{subcategories
										.filter((sub: Subcategory) =>
											sub.name.toLowerCase().includes(subcategorySearch.toLowerCase())
										)
										.slice(0, showMoreSubcategories ? undefined : 5)
										.map((subcategory: Subcategory) => (
											<label key={subcategory.id} className="flex items-center gap-2.5 cursor-pointer group">
												<input
													type="radio"
													name="subcategory"
													checked={selectedSubcategory === subcategory.id}
													onChange={() => handleSubcategoryChange(subcategory.id)}
													className="w-4 h-4 cursor-pointer accent-[#a855f7]"
												/>
												<span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
													{subcategory.name}
												</span>
											</label>
										))}
									{subcategories.length > 5 && (
										<button
											onClick={() => setShowMoreSubcategories(!showMoreSubcategories)}
											className="mt-1 text-[#ff6b00] text-xs font-medium hover:underline text-left"
										>
											{showMoreSubcategories ? 'View Less ↑' : 'View More ↓'}
										</button>
									)}
								</>
							) : (
								<p className="text-xs text-gray-400 text-center py-2">No subcategories available</p>
							)}
						</div>
					</div>
				)}
			</div>
		)}
	</div>
);

// ─── Main Shop Component ─────────────────────────────────────────────────────
const Shop: React.FC = () => {
	const router = useRouter();
	const { token } = useAuth();
	const PER_PAGE = 40;
	const [currentPage, setCurrentPage] = useState(1);
	const searchParams = useSearchParams();
	const [loading, setLoading] = useState<boolean>(true);
	const [categorySearch, setCategorySearch] = useState<string>('');
	const [subcategorySearch, setSubcategorySearch] = useState<string>('');
	const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
	const [selectedSubcategory, setSelectedSubcategory] = useState<number | undefined>(undefined);
	const [selectedBannerId, setSelectedBannerId] = useState<string | undefined>(undefined);
	const [sortBy, setSortBy] = useState<string>('all');
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [searchInputValue, setSearchInputValue] = useState<string>('');
	const [showMoreCategories, setShowMoreCategories] = useState<boolean>(false);
	const [showMoreSubcategories, setShowMoreSubcategories] = useState<boolean>(false);
	const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);
	const [isSubCategoryDropdownOpen, setIsSubCategoryDropdownOpen] = useState<boolean>(false);

	// ── Mobile drawer state ──
	const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

	// Prevent body scroll when drawer is open
	useEffect(() => {
		if (isMobileFilterOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => { document.body.style.overflow = ''; };
	}, [isMobileFilterOpen]);

	const currentFilters: ProductFilters = {
		categoryId: selectedCategory,
		subcategoryId: selectedSubcategory,
		bannerId: selectedBannerId,
		search: searchQuery.trim() || undefined,
		sort: sortBy !== 'all' ? sortBy : undefined,
		page: currentPage,
		limit: PER_PAGE,
	};

	const queryKey = ['products', currentFilters];

	const hasActiveFilters = Boolean(
		selectedCategory ||
		selectedSubcategory ||
		selectedBannerId ||
		searchQuery.trim() ||
		(sortBy && sortBy !== 'all')
	);

	useEffect(() => {
		const categoryIdParam = searchParams.get('categoryId');
		const subcategoryIdParam = searchParams.get('subcategoryId');
		const bannerIdParam = searchParams.get('bannerId');
		const searchParam = searchParams.get('search');
		const pageParam = searchParams.get('page');

		setSelectedCategory(categoryIdParam ? Number(categoryIdParam) : undefined);
		setSelectedSubcategory(subcategoryIdParam ? Number(subcategoryIdParam) : undefined);
		setSelectedBannerId(bannerIdParam ? bannerIdParam : undefined);

		if (searchParam) {
			const decodedSearch = decodeURIComponent(searchParam);
			setSearchQuery(decodedSearch);
			setSearchInputValue(decodedSearch);
		} else {
			setSearchQuery('');
			setSearchInputValue('');
		}

		setCurrentPage(pageParam ? Number(pageParam) : 1);
	}, [searchParams]);

	useEffect(() => {
		const handleShopFiltersChanged = (event: CustomEvent) => {
			const { categoryId, subcategoryId, bannerId } = event.detail;
			const newSearchParams = new URLSearchParams(searchParams);

			if (categoryId) newSearchParams.set('categoryId', categoryId.toString());
			else newSearchParams.delete('categoryId');

			if (subcategoryId) newSearchParams.set('subcategoryId', subcategoryId.toString());
			else newSearchParams.delete('subcategoryId');

			if (bannerId) newSearchParams.set('bannerId', bannerId.toString());
			else newSearchParams.delete('bannerId');

			newSearchParams.delete('search');
			router.push(`?${newSearchParams.toString()}`);
		};

		window.addEventListener('shopFiltersChanged', handleShopFiltersChanged as EventListener);
		return () => window.removeEventListener('shopFiltersChanged', handleShopFiltersChanged as EventListener);
	}, [searchParams, router]);

	const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
		queryKey: ['categories'],
		queryFn: async () => {
			try {
				const response = await apiRequest('/api/categories', token);
				if (Array.isArray(response)) return response;
				if (response?.success && Array.isArray(response.data)) return response.data;
				if (response?.data) return Array.isArray(response.data) ? response.data : [];
				return [];
			} catch {
				const categoryService = CategoryService.getInstance();
				return await categoryService.getAllCategories(token || undefined);
			}
		},
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});

	const { data: subcategories = [], isLoading: isLoadingSubcategories } = useQuery({
		queryKey: ['subcategories', selectedCategory],
		queryFn: async () => {
			if (!selectedCategory) return [];
			try {
				const response = await apiRequest(`/api/categories/${selectedCategory}/subcategories`, token);
				if (response?.success && Array.isArray(response.data)) {
					return response.data
						.map((item: { id: number; name: string }) => ({ id: item.id, name: item.name }))
						.filter((item: Subcategory) => item.id && item.name);
				}
				return [];
			} catch {
				return [];
			}
		},
		enabled: !!selectedCategory,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});

	const { data, isLoading: isLoadingProducts, error: productsError } = useQuery({
		queryKey: queryKey,
		queryFn: async () => {
			try {
				const response = await fetchProductsWithFilters(currentFilters, token);
				const productsArray: ApiProduct[] = response.data || response || [];

				const paginationInfo = {
					current_page: (() => {
						const p = response?.meta?.page;
						if (p === undefined || p === null || Number.isNaN(Number(p))) return 1;
						return toInteger(p);
					})(),
					total_pages: response?.meta?.total
						? Math.max(1, Math.ceil(Number(response.meta.total) / PER_PAGE))
						: 1,
					total_items: response?.meta?.total ?? productsArray.length,
				};

				const processedProducts = await Promise.all(
					productsArray.map(async (item) => {
						try {
							return await processProductWithReview(item);
						} catch {
							return {
								id: item.id,
								title: item.name || 'Unknown Product',
								description: item.description || 'No description available',
								originalPrice: '0',
								discountPercentage: item.discount ? `${item.discount}%` : '0%',
								price: '0',
								rating: 0,
								ratingCount: '0',
								isBestSeller: false,
								freeDelivery: true,
								image: '/placeholder-product.png',
								productImages: ['/placeholder-product.png'],
								category: 'Misc',
								brand: 'Unknown',
								brand_id: null,
								status: 'AVAILABLE' as const,
								stock: 0,
							};
						}
					})
				);

				return { products: processedProducts, meta: paginationInfo };
			} catch (error) {
				console.error('Error in products query:', error);
				throw error;
			}
		},
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
		refetchOnWindowFocus: false,
		retry: 2,
	});

	const productsData = data?.products || [];
	const pagination = data?.meta || { current_page: 1, total_pages: 1, total_items: 0 };

	const handleCategoryChange = (categoryId: number | undefined): void => {
		const newSearchParams = new URLSearchParams(searchParams);
		if (categoryId) newSearchParams.set('categoryId', categoryId.toString());
		else { newSearchParams.delete('categoryId'); setCategorySearch(''); }
		newSearchParams.delete('subcategoryId');
		newSearchParams.delete('bannerId');
		setSubcategorySearch('');
		setSelectedBannerId(undefined);
		newSearchParams.delete('search');
		newSearchParams.set('page', '1');
		router.push(`?${newSearchParams.toString()}`);
		setCurrentPage(1);
	};

	const handleSubcategoryChange = (subcategoryId: number | undefined): void => {
		const newSearchParams = new URLSearchParams(searchParams);
		if (subcategoryId) newSearchParams.set('subcategoryId', subcategoryId.toString());
		else { newSearchParams.delete('subcategoryId'); setSubcategorySearch(''); }
		newSearchParams.delete('bannerId');
		setSelectedBannerId(undefined);
		newSearchParams.set('page', '1');
		router.push(`?${newSearchParams.toString()}`);
		setCurrentPage(1);
	};

	const handleSortChange = (newSort: string | undefined): void => {
		setSortBy(newSort || 'all');
		const newSearchParams = new URLSearchParams(searchParams);
		if (newSort && newSort !== 'all') newSearchParams.set('sort', newSort);
		else newSearchParams.delete('sort');
		newSearchParams.set('page', '1');
		router.push(`?${newSearchParams.toString()}`);
		setCurrentPage(1);
	};

	const clearAllFilters = (): void => {
		setSortBy('all');
		setSearchInputValue('');
		setCategorySearch('');
		setSubcategorySearch('');
		setSelectedBannerId(undefined);
		router.push(`?`);
		setCurrentPage(1);
		setIsMobileFilterOpen(false);
	};

	const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchInputValue(e.target.value);
	};

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmedSearch = searchInputValue.trim();
		const newSearchParams = new URLSearchParams(searchParams);
		if (trimmedSearch) newSearchParams.set('search', encodeURIComponent(trimmedSearch));
		else newSearchParams.delete('search');
		newSearchParams.delete('categoryId');
		newSearchParams.delete('subcategoryId');
		newSearchParams.delete('bannerId');
		setSelectedBannerId(undefined);
		newSearchParams.set('page', '1');
		router.push(`?${newSearchParams.toString()}`);
		setCurrentPage(1);
	};

	const handleClearSearch = () => {
		setSearchInputValue('');
		const newSearchParams = new URLSearchParams(searchParams);
		newSearchParams.delete('search');
		newSearchParams.set('page', '1');
		router.push(`?${newSearchParams.toString()}`);
	};

	const getCurrentCategoryName = (): string => {
		if (selectedCategory === undefined) return 'All Categories';
		const category = categories.find((cat: Category) => cat.id === selectedCategory);
		return category ? category.name : 'Selected Category';
	};

	const getCurrentSubcategoryName = (): string | undefined => {
		if (selectedSubcategory === undefined) return undefined;
		const subcategory = subcategories.find((sub: Subcategory) => sub.id === selectedSubcategory);
		return subcategory ? subcategory.name : 'Selected Subcategory';
	};

	const getDisplayTitle = (): string => {
		if (searchQuery.trim()) return `Search Results for "${searchQuery}"`;
		if (selectedBannerId) return 'Special Offer Products';
		return getCurrentCategoryName();
	};

	useEffect(() => {
		const timer = setTimeout(() => setLoading(false), 1000);
		return () => clearTimeout(timer);
	}, []);

	// Shared filter panel props
	const filterPanelProps = {
		hasActiveFilters,
		clearAllFilters,
		searchQuery,
		sortBy,
		handleSortChange,
		isCategoryDropdownOpen,
		setIsCategoryDropdownOpen,
		categorySearch,
		setCategorySearch,
		isLoadingCategories,
		categories,
		selectedCategory,
		handleCategoryChange,
		showMoreCategories,
		setShowMoreCategories,
		isSubCategoryDropdownOpen,
		setIsSubCategoryDropdownOpen,
		subcategorySearch,
		setSubcategorySearch,
		isLoadingSubcategories,
		subcategories,
		selectedSubcategory,
		handleSubcategoryChange,
		showMoreSubcategories,
		setShowMoreSubcategories,
	};

	if (loading) return <PageLoader />;

	if (productsError) {
		return (
			<>
				<Navbar />
				<div className="min-h-[60vh] flex items-center justify-center p-6 sm:p-10">
					<div className="text-center max-w-md">
						<h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-3">Unable to Load Products</h2>
						<p className="text-gray-600 mb-6 text-sm sm:text-base">
							{productsError instanceof Error ? productsError.message : 'Unknown error occurred'}
						</p>
						<button
							onClick={() => window.location.reload()}
							className="px-6 py-3 bg-[#ff6b00] text-white rounded-lg font-medium hover:bg-[#e05a00] transition-colors"
						>
							Refresh Page
						</button>
					</div>
				</div>
				<Footer />
			</>
		);
	}

	return (
		<>
			<Navbar />
			<ProductBannerSlider />
			<CategorySlider />

			{/* ── MOBILE FILTER DRAWER ── */}
			{/* Backdrop */}
			<div
				className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 lg:hidden ${isMobileFilterOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
				onClick={() => setIsMobileFilterOpen(false)}
				aria-hidden="true"
			/>

			{/* Drawer panel */}
			<div
				className={`fixed top-0 left-0 h-full w-[85vw] max-w-[350px] z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${isMobileFilterOpen ? 'translate-x-0' : '-translate-x-full'}`}
			>
				<FilterPanel
					{...filterPanelProps}
					onClose={() => setIsMobileFilterOpen(false)}
				/>
			</div>

			{/* ── MAIN SHOP CONTAINER ── */}
			<div className="w-full bg-[#f0f0f0] min-h-screen">
				<div className="w-full max-w-[1300px] mx-auto px-3 sm:px-5 py-4 sm:py-6">

					{/* Page Title */}
					<h2 className="text-lg sm:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4 truncate">
						{getDisplayTitle()}
						{getCurrentSubcategoryName() && (
							<span className="text-gray-500 font-normal">
								{' > '}{getCurrentSubcategoryName()}
							</span>
						)}
					</h2>

					{/* Search Bar + Mobile Filter Button Row */}
					<div className="mb-3 sm:mb-4 flex gap-2 sm:gap-3 items-stretch">
						{/* Mobile Filter Toggle Button */}
						<button
							onClick={() => setIsMobileFilterOpen(true)}
							className="lg:hidden flex items-center gap-1.5 py-2.5 px-3 sm:px-4 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-[#ff6b00] hover:text-[#ff6b00] transition-colors shadow-sm flex-shrink-0 relative"
							aria-label="Open filters"
						>
							<SlidersHorizontal size={16} />
							<span className="hidden xs:inline">Filter</span>
							{hasActiveFilters && (
								<span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#ff6b00] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
									!
								</span>
							)}
						</button>

						{/* Search Form */}
						<form onSubmit={handleSearchSubmit} className="flex gap-2 sm:gap-3 items-center  min-w-0">
							<div className="flex-1 relative min-w-0">
								<input
									type="text"
									value={searchInputValue}
									onChange={handleSearchInputChange}
									placeholder="Search products, brands..."
									className="w-150 py-2.5 sm:py-3 px-3 sm:px-4 pr-8 sm:pr-10 border border-gray-300 rounded-lg text-sm outline-none bg-white transition-colors focus:border-[#ff6b00] shadow-sm"
								/>
								{searchInputValue && (
									<button
										type="button"
										onClick={handleClearSearch}
										className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 flex items-center justify-center"
									>
										<X size={15} />
									</button>
								)}
							</div>
							<button
								type="submit"
								className="py-2.5 sm:py-3 px-3 sm:px-6 bg-[#ff6b00] text-white rounded-lg text-sm font-semibold cursor-pointer flex items-center gap-1.5 sm:gap-2 hover:bg-[#e05a00] transition-colors shadow-sm whitespace-nowrap flex-shrink-0"
							>
								<Search size={15} className="sm:hidden" />
								<span className="hidden sm:inline">Search</span>
								<span className="sm:hidden sr-only">Search</span>
							</button>
						</form>
					</div>

					{/* Product Count Badge */}
					<div className="mb-4 sm:mb-6">
						<div className="inline-flex items-center gap-2 py-1.5 sm:py-2 px-4 sm:px-5 bg-orange-50 border border-orange-200 rounded-full text-sm">
							{isLoadingProducts ? (
								<>
									<div className="w-3 h-3 border-2 border-gray-200 border-t-[#ff6b00] rounded-full animate-spin" />
									<span className="text-orange-800 text-xs sm:text-sm">Loading products...</span>
								</>
							) : (
								<>
									<span className="font-bold text-[#ff6b00] text-sm sm:text-base">{pagination.total_items}</span>
									<span className="text-orange-900 text-xs sm:text-sm">
										{pagination.total_items === 1 ? 'product' : 'products'} found
									</span>
								</>
							)}
						</div>
					</div>

					{/* Two-column layout: desktop sidebar + product grid */}
					<div className="flex gap-4 sm:gap-5">

						{/* ── DESKTOP SIDEBAR (hidden on mobile/tablet) ── */}
						<div className="hidden lg:block w-[280px] flex-shrink-0">
							<div className="sticky top-10">
								<FilterPanel {...filterPanelProps} />
							</div>
						</div>

						{/* ── PRODUCT GRID ── */}
						<div className="flex-1 min-w-0">
							<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-4 sm:gap-x-5 sm:gap-y-5 md:gap-x-6 md:gap-y-6 w-full">
								{isLoadingProducts ? (
									Array(10).fill(null).map((_, index) => (
										<ProductCardSkeleton key={index} count={1} />
									))
								) : pagination.total_items > 0 ? (
									productsData.map((product) => (
										<ProductCard key={product.id} product={product} />
									))
								) : (
									<div className="col-span-full flex flex-col items-center justify-center p-8 sm:p-16 text-center bg-white rounded-xl">
										<div className="text-5xl sm:text-6xl mb-4 sm:mb-5 opacity-40">📦</div>
										<h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2 sm:mb-3">
											No products found
										</h3>
										<p className="text-xs sm:text-sm text-gray-400 mb-5 sm:mb-6 max-w-sm">
											{searchQuery.trim()
												? `No products match "${searchQuery}". Try adjusting your search terms.`
												: selectedBannerId
													? 'No products found for this special offer.'
													: selectedCategory === undefined
														? 'No products available at the moment.'
														: `No products in ${getCurrentCategoryName()}${getCurrentSubcategoryName() ? ` > ${getCurrentSubcategoryName()}` : ''}.`}
										</p>
										{hasActiveFilters && (
											<button
												onClick={clearAllFilters}
												className="py-2.5 px-6 bg-[#ff6b00] text-white rounded-lg text-sm font-medium hover:bg-[#e05a00] transition-colors"
											>
												Clear All Filters
											</button>
										)}
									</div>
								)}
							</div>

							{/* Pagination */}
							{pagination.total_pages > 1 && (
								<div className="flex items-center justify-center gap-3 sm:gap-5 mt-6 sm:mt-10 p-3 sm:p-5">
									<button
										className="py-2.5 px-4 sm:px-6 bg-[#ff6b00] text-white rounded-lg text-sm font-medium hover:bg-[#e05a00] transition-all hover:-translate-y-px disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:translate-y-0"
										disabled={currentPage === 1}
										onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
									>
										Previous
									</button>
									<span className="text-xs sm:text-sm text-gray-500 font-medium whitespace-nowrap">
										Page {pagination.current_page} of {pagination.total_pages}
									</span>
									<button
										className="py-2.5 px-4 sm:px-6 bg-[#ff6b00] text-white rounded-lg text-sm font-medium hover:bg-[#e05a00] transition-all hover:-translate-y-px disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:translate-y-0"
										disabled={currentPage >= pagination.total_pages}
										onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.total_pages))}
									>
										Next
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			<Footer />
		</>
	);
};

export default Shop;