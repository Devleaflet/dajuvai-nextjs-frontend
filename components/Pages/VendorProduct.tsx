
'use client';

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { fetchProducts, updateProduct, deleteProduct } from "@/lib/api/products";
import EditProductModal from "@/components/Components/Modal/EditProductModalRedesigned";
import NewProductModal from "@/components/Components/NewProductModalRedesigned";
import Pagination from "@/components/Components/Pagination";
import ProductList from "@/components/Components/ProductList";
import { Product } from "@/components/Components/Types/Product";
import { useVendorAuth } from "@/lib/context/VendorAuthContext";
import "@/styles/VendorProduct.css";
import { Product as ApiProduct, ProductFormData } from "@/lib/types/product";
import * as XLSX from "xlsx";
import axiosInstance from "@/lib/api/axiosInstance";

interface VendorProductsStats {
	totalProducts: number;
	activeProducts: number;
	outOfStockProducts: number;
	averageRating: number;
	totalReviews: number;
	topSellingProductName: string;
}

const ProductListSkeleton: React.FC = () => {
	return (
		<div className="vendor-product__skeleton">
			<div className="vendor-product__skeleton-header">
				<div className="vendor-product__skeleton-search shimmer"></div>
			</div>
			<div className="vendor-product__skeleton-tabs">
				{[1, 2, 3, 4].map((i) => (
					<div
						key={`tab-${i}`}
						className="vendor-product__skeleton-tab shimmer"
					></div>
				))}
			</div>
			<div className="vendor-product__skeleton-table">
				{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
					<div
						key={`row-${i}`}
						className="vendor-product__skeleton-row"
					>
						<div
							className="vendor-product__skeleton-cell shimmer"
							style={{
								width: "2.5rem",
								height: "2.5rem",
								borderRadius: "0.5rem",
							}}
						></div>
						<div
							className="vendor-product__skeleton-cell shimmer"
							style={{ width: "8rem", height: "1.1rem" }}
						></div>
						<div
							className="vendor-product__skeleton-cell shimmer"
							style={{ width: "5rem", height: "1.1rem" }}
						></div>
						<div
							className="vendor-product__skeleton-cell shimmer"
							style={{ width: "4rem", height: "1.1rem" }}
						></div>
						<div
							className="vendor-product__skeleton-cell shimmer"
							style={{ width: "3rem", height: "1.1rem" }}
						></div>
						<div
							className="vendor-product__skeleton-cell shimmer"
							style={{ width: "2.5rem", height: "1.1rem" }}
						></div>
					</div>
				))}
			</div>
		</div>
	);
};

const VendorProduct: React.FC = () => {
	const { authState } = useVendorAuth();
	const queryClient = useQueryClient();
	const serverFetchLimit = 100;
	const [isMobile] = useState<boolean>(window.innerWidth < 768);
	const [showAddModal, setShowAddModal] = useState<boolean>(false);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [productsPerPage] = useState<number>(10);
	const [docketHeight] = useState<number>(80);
	const [showEditModal, setShowEditModal] = useState<boolean>(false);
	const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [sortOption, setSortOption] = useState<string>("newest");
	const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
	const [productToDelete, setProductToDelete] = useState<Product | null>(null);
	const [vendorProductsStats, setVendorProductsStats] =
		useState<VendorProductsStats | null>(null);
	const [vendorStatsLoading, setVendorStatsLoading] = useState<boolean>(true);
	const [showRestockBanner, setShowRestockBanner] = useState<boolean>(true);

	React.useEffect(() => {
		setCurrentPage(1);
	}, [sortOption]);

	const deleteProductMutation = useMutation({
		mutationFn: async ({ productId }: { productId: number }) => {
			if (!authState.token) throw new Error("Authentication token is missing");
			if (!authState.vendor?.id) throw new Error("Vendor ID is missing");
			return deleteProduct(productId, authState.token);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [
					"vendor-products",
					authState.vendor?.id,
					authState.token,
				],
			});
			toast.success("Product deleted successfully!");
		},
		onError: (error: Error) => {
			console.error("Error deleting product:", error);
			toast.error(error.message || "Failed to delete product");
		},
	});

	const {
		data: productData,
		isLoading: loading,
		isError,
		error,
	} = useQuery({
		queryKey: [
			"vendor-products",
			authState.vendor?.id,
			authState.token,
		],
		queryFn: async () => {
			if (!authState.vendor?.id || !authState.token)
				throw new Error("Missing vendor or token");

			const vendorId = Number(authState.vendor.id);
			const firstResponse = await fetchProducts(vendorId, 1, serverFetchLimit);

			if (!firstResponse.data || typeof firstResponse.data !== "object")
				throw new Error("Invalid response");
			if (
				!firstResponse.data.success ||
				!firstResponse.data.data ||
				!Array.isArray(firstResponse.data.data.product)
			)
				throw new Error("Invalid response format");

			const totalProductsCount = Number(firstResponse.data.data.total || 0);
			const totalPages = Math.max(
				1,
				Math.ceil(totalProductsCount / serverFetchLimit)
			);

			const remainingResponses =
				totalPages > 1
					? await Promise.all(
							Array.from({ length: totalPages - 1 }, (_, index) =>
								fetchProducts(vendorId, index + 2, serverFetchLimit)
							)
					  )
					: [];

			const allRawProducts = [
				...firstResponse.data.data.product,
				...remainingResponses.flatMap((pageResponse) =>
					Array.isArray(pageResponse.data?.data?.product)
						? pageResponse.data.data.product
						: []
				),
			];

			const products: Product[] = allRawProducts.map(
				(product: ApiProduct): Product => {
					const productImages = Array.isArray(product.productImages)
						? product.productImages.map((img: string | { url?: string }) =>
							typeof img === "string" ? img : img.url || ""
						)
						: [];

					const variantImages: string[] = [];
					if (
						(product as any).hasVariants &&
						(product as any).variants &&
						Array.isArray((product as any).variants)
					) {
						(product as any).variants.forEach((variant: any) => {
							if (
								variant.variantImages &&
								Array.isArray(variant.variantImages)
							) {
								variant.variantImages.forEach(
									(img: string | { url?: string }) => {
										const imageUrl =
											typeof img === "string" ? img : img.url || "";
										if (imageUrl && !variantImages.includes(imageUrl)) {
											variantImages.push(imageUrl);
										}
									}
								);
							}
						});
					}

					const images = [...productImages, ...variantImages].filter(Boolean);
					let basePrice = 0;
					if (typeof product.basePrice === "number")
						basePrice = product.basePrice;
					else if (typeof product.basePrice === "string")
						basePrice = parseFloat(product.basePrice);
					else if (
						typeof product.basePrice === "undefined" ||
						product.basePrice === null
					)
						basePrice = 0;
					let discount = 0;
					if (typeof product.discount === "number") discount = product.discount;
					else if (typeof product.discount === "string")
						discount = parseFloat(product.discount);
					else if (
						typeof product.discount === "undefined" ||
						product.discount === null
					)
						discount = 0;
					const discountType = (product.discountType || "").toUpperCase();
					let price = basePrice;
					let originalPrice: string | undefined = undefined;
					if (
						discount > 0 &&
						(discountType === "PERCENTAGE" ||
							discountType === "FLAT" ||
							discountType === "FIXED")
					) {
						if (discountType === "PERCENTAGE") {
							price = basePrice - (basePrice * discount) / 100;
							originalPrice = basePrice.toFixed(2);
						} else if (discountType === "FLAT" || discountType === "FIXED") {
							price = basePrice - discount;
							originalPrice = basePrice.toFixed(2);
						}
					}

					const normalizedVariants = Array.isArray((product as any).variants)
						? (product as any).variants.map((v: any) => {
							const rawBase =
								typeof v?.price !== "undefined"
									? v.price
									: typeof v?.basePrice !== "undefined"
										? v.basePrice
										: typeof v?.originalPrice !== "undefined"
											? v.originalPrice
											: typeof product.basePrice !== "undefined"
												? product.basePrice
												: (product as any).price;
							const baseNum =
								typeof rawBase === "string"
									? parseFloat(rawBase)
									: Number(rawBase) || 0;
							let calc = baseNum;
							if (
								discount > 0 &&
								(discountType === "PERCENTAGE" ||
									discountType === "FLAT" ||
									discountType === "FIXED")
							) {
								if (discountType === "PERCENTAGE") {
									calc = baseNum - (baseNum * discount) / 100;
								} else {
									calc = baseNum - discount;
								}
							}
							return { ...v, calculatedPrice: calc };
						})
						: undefined;

					let status: "AVAILABLE" | "OUT_OF_STOCK" | "LOW_STOCK" = "AVAILABLE";
					if (product.status === "OUT_OF_STOCK") status = "OUT_OF_STOCK";
					else if (product.status === "LOW_STOCK") status = "LOW_STOCK";
					const mappedProduct = {
						id: product.id,
						name: product.name,
						title: product.name,
						description: product.description,
						price: price.toFixed(2),
						basePrice: basePrice,
						originalPrice: originalPrice,
						stock: product.stock,
						discount:
							discount !== null && discount !== undefined
								? discount.toString()
								: "0",
						discountType: (discountType === "PERCENTAGE"
							? "PERCENTAGE"
							: discountType === "FLAT" || discountType === "FIXED"
								? "FLAT"
								: undefined) as "PERCENTAGE" | "FLAT" | undefined,
						size: product.size || [],
						status: status,
						productImages: images,
						variants: normalizedVariants,
						subcategory: product.subcategory,
						vendor: product.vendor?.businessName || "",
						category: product.subcategory?.name || "",
						categoryId: product.categoryId || undefined,
						subcategoryId: product.subcategory?.id || undefined,
						brand_id: product.brand_id || undefined,
						dealId: product.dealId || undefined,
						rating: 0,
						ratingCount: 0,
						image:
							images.length > 0 && typeof images[0] === "string"
								? images[0]
								: "",
						piece: product.stock,
						availableColor: product.size?.join(", ") || "",
						onSale: !!product.discount,
						isFeatured: false,
						isBestSeller: false,
						freeDelivery: false,
						created_at: product.created_at,
					};

					return mappedProduct as Product;
				}
			);

			return {
				products,
				total: totalProductsCount || products.length,
				serverTotal: totalProductsCount || products.length,
			} as { products: Product[]; total: number; serverTotal: number };
		},
		enabled: !!authState.vendor?.id && !!authState.token,
	});

	const fetchVendorProductsStats = React.useCallback(async () => {
		if (!authState.token) return;
		setVendorStatsLoading(true);
		try {
			const response = await axiosInstance.get("/api/vendor/products/stats", {
				headers: {
					Authorization: `Bearer ${authState.token}`,
				},
			});

			const payload = response.data?.data ?? response.data ?? {};
			const row =
				typeof payload === "object" && payload !== null
					? (payload as Record<string, unknown>)
					: {};

			const toNumber = (value: unknown, fallback = 0): number => {
				const parsed = typeof value === "number" ? value : Number(value);
				return Number.isFinite(parsed) ? parsed : fallback;
			};

			const topSelling =
				typeof row["topSellingProduct"] === "object" && row["topSellingProduct"] !== null
					? (row["topSellingProduct"] as Record<string, unknown>)
					: {};

			const topSellingItemRaw = row["topSellingItem"];
			const topSellingItemName =
				typeof topSellingItemRaw === "string"
					? topSellingItemRaw
					: typeof topSellingItemRaw === "object" && topSellingItemRaw !== null
						? String(
							(topSellingItemRaw as Record<string, unknown>)["productName"] ??
								(topSellingItemRaw as Record<string, unknown>)["name"] ??
								(topSellingItemRaw as Record<string, unknown>)["title"] ??
								"N/A"
						)
						: "N/A";

			setVendorProductsStats({
				totalProducts: toNumber(
					row["totalProducts"] ?? row["productsCount"] ?? row["total"] ?? row["totalProduct"]
				),
				activeProducts: toNumber(
					row["totalActiveProducts"] ??
						row["activeProducts"] ??
						row["availableProducts"] ??
						row["inStockProducts"]
				),
				outOfStockProducts: toNumber(
					row["outOfStockCount"] ??
						row["outOfStockProducts"] ??
						row["outOfStock"] ??
						row["outStockProducts"]
				),
				averageRating: toNumber(row["averageRating"] ?? row["avgRating"], 0),
				totalReviews: toNumber(row["totalReviews"] ?? row["reviewCount"], 0),
				topSellingProductName: String(
					row["topSellingProductName"] ??
						topSellingItemName ??
						topSelling["productName"] ??
						topSelling["name"] ??
						"N/A"
				),
			});
		} catch (error) {
			console.error("Error fetching vendor product stats:", error);
			setVendorProductsStats(null);
		} finally {
			setVendorStatsLoading(false);
		}
	}, [authState.token]);

	React.useEffect(() => {
		if (!authState.token) {
			setVendorProductsStats(null);
			setVendorStatsLoading(false);
			return;
		}

		fetchVendorProductsStats();
	}, [authState.token, fetchVendorProductsStats]);

	const sortProducts = (products: Product[]) => {
		const sorted = [...products];
		const collator = new Intl.Collator("en", {
			numeric: true,
			sensitivity: "base",
		});

		const getSortableName = (product: Product) =>
			String(product.name || product.title || "")
				.trim()
				.replace(/\s+/g, " ");

		const getSortablePrice = (product: Product) => {
			if (product.variants && product.variants.length > 0) {
				const variantPrices = product.variants
					.map((variant: any) => {
						const rawPrice =
							variant?.calculatedPrice ??
							variant?.price ??
							variant?.originalPrice ??
							variant?.basePrice;
						const parsed =
							typeof rawPrice === "string"
								? parseFloat(rawPrice)
								: Number(rawPrice);
						return Number.isFinite(parsed) ? parsed : null;
					})
					.filter((value): value is number => value !== null);

				if (variantPrices.length > 0) {
					return Math.min(...variantPrices);
				}
			}

			const parsedPrice =
				typeof product.price === "string"
					? parseFloat(product.price)
					: Number(product.price);

			return Number.isFinite(parsedPrice) ? parsedPrice : 0;
		};

		const getSortableDate = (product: Product) => {
			const rawDate = product.created_at;
			if (!rawDate) return 0;
			const parsedDate = new Date(rawDate).getTime();
			return Number.isFinite(parsedDate) ? parsedDate : 0;
		};

		switch (sortOption) {
			case "newest":
				return sorted.sort(
					(a: Product, b: Product) => getSortableDate(b) - getSortableDate(a)
				);
			case "oldest":
				return sorted.sort(
					(a: Product, b: Product) => getSortableDate(a) - getSortableDate(b)
				);
			case "price-asc":
				return sorted.sort(
					(a, b) => getSortablePrice(a) - getSortablePrice(b)
				);
			case "price-desc":
				return sorted.sort(
					(a, b) => getSortablePrice(b) - getSortablePrice(a)
				);
			case "name-asc":
				return sorted.sort((a, b) =>
					collator.compare(getSortableName(a), getSortableName(b))
				);
			case "name-desc":
				return sorted.sort((a, b) =>
					collator.compare(getSortableName(b), getSortableName(a))
				);
			default:
				return sorted;
		}
	};

	const handleProductSubmit = (success: boolean) => {
		if (success) {
			queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
			toast.success("Product created successfully!");
		}
	};

	const handleDeleteProduct = (product: Product) => {
		setProductToDelete(product);
		setShowDeleteDialog(true);
	};

	const confirmDeleteProduct = () => {
		if (productToDelete) {
			deleteProductMutation.mutate({
				productId: productToDelete.id,
			});
			setShowDeleteDialog(false);
			setProductToDelete(null);
		}
	};

	const cancelDeleteProduct = () => {
		setShowDeleteDialog(false);
		setProductToDelete(null);
	};

	const addProductMutation = useMutation({
		mutationFn: async (productData: ProductFormData) => {
			//("=== VENDOR PRODUCT CREATION START ===");
			//("VendorProduct: token exists:", !!authState.token);
			//("VendorProduct: vendor exists:", !!authState.vendor);
			//("VendorProduct: vendor ID:", authState.vendor?.id);
			//("VendorProduct: Product data received:", productData);

			if (!authState.token) {
				throw new Error("No authentication token found");
			}

			if (!authState.vendor) {
				throw new Error("No vendor data found");
			}

			const formData = new FormData();
			formData.append("name", String(productData.name));
			formData.append("subcategoryId", String(productData.subcategoryId));
			formData.append("hasVariants", String(productData.hasVariants));

			if (productData.description) {
				formData.append("description", String(productData.description));
			}

			if (!productData.hasVariants) {
				//("VendorProduct: Creating non-variant product");
				if (productData.basePrice != null) {
					formData.append("basePrice", String(productData.basePrice));
				}
				if (productData.stock != null) {
					formData.append("stock", String(productData.stock));
				}
				if (productData.status) {
					formData.append("status", String(productData.status));
				}

				if (
					productData.productImages &&
					Array.isArray(productData.productImages)
				) {
					productData.productImages.forEach((image, index) => {
						if (index < 5 && image instanceof File) {
							formData.append("productImages", image);
						}
					});
				}
			} else {
				//("VendorProduct: Creating variant product");
				if (productData.variants && Array.isArray(productData.variants)) {

					formData.append("variants", JSON.stringify(productData.variants));

					productData.variants.forEach((variant, variantIndex) => {

						if (variant.images && Array.isArray(variant.images)) {

							variant.images.forEach((image, imageIndex) => {

								if (image instanceof File) {
									const imageKey = `variantImages${variantIndex + 1}`;
									formData.append(imageKey, image);

								} else {
									console.warn(
										`VendorProduct: Image ${imageIndex + 1} for variant ${variant.sku
										} is not a File:`,
										image
									);
								}
							});
						} else {
							console.error(
								`VendorProduct: Variant ${variant.sku} has no images or images is not an array:`,
								variant.images
							);
						}
					});
				}
			}

			if (productData.discount && Number(productData.discount) > 0) {
				formData.append("discount", Number(productData.discount).toFixed(2));
				formData.append(
					"discountType",
					String(productData.discountType || "PERCENTAGE")
				);
			}

			if (productData.dealId != null) {
				formData.append("dealId", String(productData.dealId));
			}

			if (productData.bannerId != null) {
				formData.append("bannerId", String(productData.bannerId));
			}

			if (productData.brandId != null) {
				formData.append("brandId", String(productData.brandId));
			}

			throw new Error("Use NewProductModal for creating products");
		},
		onSuccess: (data) => {
			toast.success("Product created successfully!");

			queryClient.invalidateQueries({
				queryKey: ["vendor-products"],
			});

			queryClient.refetchQueries({
				queryKey: [
					"vendor-products",
					authState.vendor?.id,
					authState.token,
				],
			});

			//("Cache invalidated and refetch triggered");
			setShowAddModal(false);
		},
		onError: (error: Error) => {
			console.error("Error creating product:", error);
			toast.error(error.message || "Failed to create product");
		},
	});

	const editProductMutation = useMutation({
		mutationFn: async ({
			productId,
			productData,
			categoryId,
			subcategoryId,
		}: {
			productId: number;
			productData: ProductFormData;
			categoryId: number;
			subcategoryId: number;
		}) => {
			//("🔄 EDIT PRODUCT MUTATION START");
			//("Product ID:", productId);
			//("Category ID:", categoryId);
			//("Subcategory ID:", subcategoryId);
			//("Product Data:", productData);

			if (!authState.token) throw new Error("Authentication token is missing");
			if (!authState.vendor?.id) throw new Error("Vendor ID is missing");
			if (!categoryId || !subcategoryId) {
				throw new Error("Category and subcategory are required");
			}

			const updatePayload: any = {
				name: productData.name,
				subcategoryId: subcategoryId,
				hasVariants: productData.hasVariants || false,
			};

			if (productData.description)
				updatePayload.description = productData.description;
			if (
				productData.discount !== undefined &&
				productData.discount !== null &&
				productData.discount !== ""
			) {
				updatePayload.discount =
					typeof productData.discount === "string"
						? parseFloat(productData.discount)
						: productData.discount;
			}
			if (productData.discountType)
				updatePayload.discountType = productData.discountType;
			if (productData.dealId) updatePayload.dealId = productData.dealId;
			if (productData.bannerId) updatePayload.bannerId = productData.bannerId;
			if (productData.productImages && productData.productImages.length > 0) {
				updatePayload.productImages = productData.productImages;
			}

			if (productData.hasVariants) {
				if (productData.variants && productData.variants.length > 0) {
					updatePayload.variants = productData.variants.map((variant: any) => ({
						sku: variant.sku,
						basePrice: variant.price || variant.basePrice,
						discount: variant.discount || 0,
						discountType: variant.discountType || "PERCENTAGE",
						attributes: variant.attributes || {},
						variantImages: variant.images || variant.variantImages || [],
						stock: variant.stock,
						status: variant.status || "AVAILABLE",
					}));
				}
			} else {
				updatePayload.basePrice =
					typeof productData.basePrice === "string"
						? parseFloat(productData.basePrice)
						: productData.basePrice;
				updatePayload.stock =
					typeof productData.stock === "string"
						? parseInt(productData.stock)
						: productData.stock;
				updatePayload.status = productData.status || "AVAILABLE";
			}



			return updateProduct(productId, categoryId, subcategoryId, updatePayload);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [
					"vendor-products",
					authState.vendor?.id,
					authState.token,
				],
			});
		},
	});

	const handleAddProduct = (productData: ProductFormData) => {
		addProductMutation.mutate(productData, {
			onSuccess: () => {
				setShowAddModal(false);
			},
			onError: (err: Error) => {
				toast.error(err.message || "Failed to add product.");
			},
		});
	};

	const handleEditProduct = (product: Product) => {


		let discount: number | null = null;
		if (product.discount) {
			if (typeof product.discount === "number") {
				discount = product.discount;
			} else {
				discount = parseFloat(product.discount.toString());
			}
		}

		type SubcategoryType = {
			id: number;
			name: string;
			image?: string | null;
			createdAt?: string;
			updatedAt?: string;
		};
		const subcategory =
			product.subcategory &&
				typeof product.subcategory === "object" &&
				"id" in product.subcategory &&
				"name" in product.subcategory
				? {
					id: product.subcategory.id,
					name: product.subcategory.name,
					image: (product.subcategory as SubcategoryType).image || null,
					createdAt:
						(product.subcategory as SubcategoryType).createdAt ||
						new Date().toISOString(),
					updatedAt:
						(product.subcategory as SubcategoryType).updatedAt ||
						new Date().toISOString(),
				}
				: {
					id: 0,
					name: "",
					image: null,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};


		let categoryId = product.categoryId || 0;
		if (
			!categoryId &&
			product.subcategory &&
			typeof product.subcategory === "object"
		) {
			if ("categoryId" in product.subcategory) {
				categoryId = (product.subcategory as any).categoryId;
			} else if (
				"category" in product.subcategory &&
				product.subcategory.category &&
				typeof product.subcategory.category === "object" &&
				"id" in product.subcategory.category
			) {
				categoryId = (product.subcategory.category as any).id;
			}
		}

		const apiProduct: ApiProduct = {
			...(product as any),
			categoryId: categoryId,
			basePrice:
				typeof product.basePrice === "number"
					? product.basePrice
					: product.basePrice
						? parseFloat(product.basePrice.toString())
						: typeof product.price === "string"
							? parseFloat(product.price)
							: typeof product.price === "number"
								? product.price
								: 0,
			discount: discount,
			discountType: (product.discountType === "PERCENTAGE"
				? "PERCENTAGE"
				: "FLAT") as "PERCENTAGE" | "FLAT",
			status:
				product.status === "OUT_OF_STOCK"
					? "OUT_OF_STOCK"
					: product.status === "LOW_STOCK"
						? "LOW_STOCK"
						: "AVAILABLE",
			productImages:
				product.productImages || (product.image ? [product.image] : []),
			inventory: [],
			vendorId: 0,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			subcategory: subcategory,
			vendor:
				typeof product.vendor === "object" && product.vendor !== null
					? product.vendor
					: {
						id: 0,
						businessName: "",
						email: "",
						phoneNumber: "",
						districtId: 0,
						isVerified: false,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
						district: { id: 0, name: "" },
					},
			brand: null,
			deal: null,
			hasVariants: (product as any).hasVariants || false,
			variants: (product as any).variants || [],
			price:
				typeof product.price === "number"
					? product.price
					: product.price
						? parseFloat(product.price.toString())
						: 0,
			image: product.image || "",
			brand_id: product.brand_id || null,
			bannerId: (product as any).bannerId || null,
			brandId: (product as any).brandId || null,
		} as ApiProduct;


		setEditingProduct(apiProduct);
		setShowEditModal(true);
	};

	const handleSaveEditProduct = async (
		_productId: number,
		_productData: ProductFormData,
		_categoryId: number,
		_subcategoryId: number
	) => {
		try {
			await queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
		} finally {
			setShowEditModal(false);
			setEditingProduct(null);
		}
	};

	const products: Product[] = productData?.products || [];

	const filteredProducts = products.filter((product) => {
		if (!searchQuery) return true;
		const searchLower = searchQuery.toLowerCase();
		return (
			product.name?.toLowerCase().includes(searchLower) ||
			product.description?.toLowerCase().includes(searchLower) ||
			(typeof product.subcategory === "object" &&
				product.subcategory?.name?.toLowerCase().includes(searchLower)) ||
			product.category?.toLowerCase().includes(searchLower)
		);
	});

	const sortedProducts = sortProducts(filteredProducts);
	const finalProducts = sortedProducts;
	const finalTotal = finalProducts.length;
	const lowStockProductsCount = finalProducts.filter((product) => {
		const status = String(product.status || "").toUpperCase();
		if (status === "LOW_STOCK") return true;
		if (status.length > 0) return false;
		const stock = Number(product.stock ?? 0);
		return Number.isFinite(stock) && stock > 0 && stock <= 5;
	}).length;
	const paginatedProducts = finalProducts.slice(
		(currentPage - 1) * productsPerPage,
		currentPage * productsPerPage
	);
	const outOfStockCount = finalProducts.filter(
		(product) =>
			String(product.status || "").toUpperCase() === "OUT_OF_STOCK" ||
			Number(product.stock || 0) <= 0
	).length;
	const totalActiveProducts = Math.max(finalTotal - outOfStockCount, 0);
	const displayTotalProducts = vendorProductsStats?.totalProducts ?? finalTotal;
	const displayActiveProducts =
		vendorProductsStats?.activeProducts ?? totalActiveProducts;
	const displayOutOfStockProducts =
		vendorProductsStats?.outOfStockProducts ?? outOfStockCount;
	const displayTopSellingItemName =
		vendorProductsStats?.topSellingProductName || "N/A";

	React.useEffect(() => {
		const totalPages = Math.max(1, Math.ceil(finalTotal / productsPerPage));
		if (currentPage > totalPages) {
			setCurrentPage(totalPages);
		}
	}, [currentPage, finalTotal, productsPerPage]);

	const handlePageChange = (pageNumber: number) => {
		setCurrentPage(pageNumber);
	};

	const handleExportExcel = () => {
		const exportData = finalProducts.map((product) => ({
			Name: product.name,
			Category:
				product.category ||
				(typeof product.subcategory === "object" &&
					product.subcategory?.name) ||
				"",
			Price: product.price,
			Stock: product.stock,
			Status: product.status,
		}));
		const worksheet = XLSX.utils.json_to_sheet(exportData);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
		XLSX.writeFile(workbook, "vendor-products.xlsx");
	};

	return (
		<div className="vendor-product-page">
			<div className="vendor-product__stats-grid">
				<div className="vendor-product__stats-card">
					<p className="vendor-product__stats-label">Total Products</p>
					<h3 className="vendor-product__stats-value">
						{vendorStatsLoading ? "..." : displayTotalProducts}
					</h3>
				</div>
				<div className="vendor-product__stats-card">
					<p className="vendor-product__stats-label">Active Products</p>
					<h3 className="vendor-product__stats-value">
						{vendorStatsLoading ? "..." : displayActiveProducts}
					</h3>
				</div>
				<div className="vendor-product__stats-card">
					<p className="vendor-product__stats-label">Out of Stock</p>
					<h3 className="vendor-product__stats-value">
						{vendorStatsLoading ? "..." : displayOutOfStockProducts}
					</h3>
				</div>
				<div className="vendor-product__stats-card">
					<p className="vendor-product__stats-label">Top Selling Item</p>
					<h3 className="vendor-product__stats-value vendor-product__stats-value--text">
						{vendorStatsLoading ? "Loading..." : displayTopSellingItemName}
					</h3>
				</div>
			</div>
			<div className="vendor-product__search-row dashboard__search-container">
				<div
					className="dashboard__search"
				>
					<input
						className="dashboard__search-input"
						type="text"
						placeholder="Search products..."
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							setCurrentPage(1);
						}}
					/>
					<span className="dashboard__search-icon" />
				</div>
				<select
					className="vendor-product__sort-select"
					value={sortOption}
					onChange={(e) => setSortOption(e.target.value)}
				>
					<option value="newest">Newest</option>
					<option value="oldest">Oldest</option>
					<option value="price-asc">Price: Low to High</option>
					<option value="price-desc">Price: High to Low</option>
					<option value="name-asc">Name: A-Z</option>
					<option value="name-desc">Name: Z-A</option>
				</select>
			</div>
			<main
				className="dashboard__main vendor-product__content"
				style={{
					paddingBottom: isMobile ? `${docketHeight + 24}px` : "24px",
				}}
			>
					{showRestockBanner && lowStockProductsCount > 0 && (
						<div className="vendor-product__restock-alert" role="status" aria-live="polite">
							<div className="vendor-product__restock-alert-message">
								<span className="vendor-product__restock-alert-icon" aria-hidden="true" />
								<p className="vendor-product__restock-alert-text">
									You have <span style={{ fontWeight: 700 }}>{lowStockProductsCount}</span> products with low stock. Consider restocking soon.
								</p>
							</div>
							<button
								type="button"
								className="vendor-product__restock-alert-close"
								onClick={() => setShowRestockBanner(false)}
								aria-label="Dismiss low stock alert"
							>
								&times;
							</button>
						</div>
					)}
					<div className="vendor-product__actions">
						<button
							className="vendor-product__add-btn"
							onClick={() => setShowAddModal(true)}
						>
							<span className="vendor-product__add-icon">+</span>
							Add Product
						</button>
						<button
							className="vendor-product__export-btn"
							onClick={handleExportExcel}
						>
							Export to Excel
						</button>
					</div>
					{showAddModal && (
						<NewProductModal
							isOpen={showAddModal}
							onClose={() => setShowAddModal(false)}
							onSubmit={handleProductSubmit}
						/>
					)}
					{showEditModal && editingProduct && (
						<EditProductModal
							show={showEditModal}
							onClose={() => {
								setShowEditModal(false);
								setEditingProduct(null);
							}}
							onSave={handleSaveEditProduct}
							product={editingProduct as any}
						/>
					)}
					{showDeleteDialog && productToDelete && (
						<div className="vendor-product__delete-dialog">
							<div className="vendor-product__delete-dialog-content">
								<h3>Confirm Delete</h3>
								<p>
									Are you sure you want to delete &quot;
									<b>{productToDelete.name}</b>
									&quot;? This action cannot be undone.
								</p>
								<div className="vendor-product__delete-dialog-actions">
									<button
										className="vendor-product__delete-dialog-cancel"
										onClick={cancelDeleteProduct}
									>
										Cancel
									</button>
									<button
										className="vendor-product__delete-dialog-confirm"
										onClick={confirmDeleteProduct}
									>
										Delete
									</button>
								</div>
							</div>
						</div>
					)}
					{loading ? (
						<ProductListSkeleton />
					) : isError ? (
						<div className="vendor-product__error">
							{(error as Error).message}
						</div>
					) : finalProducts.length > 0 ? (
						<>
							<ProductList
								products={paginatedProducts}
								onEdit={handleEditProduct}
								onDelete={handleDeleteProduct}
								showVendor={false}
							/>
							{finalTotal > productsPerPage && (
								<Pagination
									currentPage={currentPage}
									totalPages={Math.ceil(finalTotal / productsPerPage)}
									onPageChange={handlePageChange}
								/>
							)}
						</>
					) : (
						<div className="vendor-product__no-results">No product found.</div>
					)}
			</main>
		</div>
	);
};

export default VendorProduct;
