import React from "react";
import { Product } from "@/components/Components/Types/Product";
import { API_BASE_URL } from "@/lib/config";

interface ProductListProps {
	products: Product[];
	onEdit: (product: Product) => void;
	onDelete: (product: Product) => void;
	showVendor: boolean;
}

const ProductList: React.FC<ProductListProps> = ({
	products,
	onEdit,
	onDelete,
	showVendor,
}) => {
	// Helper function to compute discounted price
	const calculatePrice = (
		basePrice: string | number,
		discount?: string,
		discountType?: string
	): number => {
		const base =
			typeof basePrice === "string" ? parseFloat(basePrice) : basePrice;
		if (!discount || !discountType) return base;
		const discountValue = parseFloat(discount) || 0;
		if (discountType === "FIXED" || discountType === "FLAT") {
			return base - discountValue;
		}
		if (discountType === "PERCENTAGE") {
			return base - (base * discountValue) / 100;
		}
		return base;
	};

	// Normalize/complete image URLs similar to Shop page
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

	// Get display image for product
	const getDisplayImage = (product: Product): string => {
		const productImages = (product.productImages || [])
			.filter(
				(img): img is string =>
					!!img && typeof img === "string" && img.trim() !== ""
			)
			.map(processImageUrl)
			.filter((img): img is string => !!img);
		if (productImages.length > 0) return productImages[0]!;

		if (typeof product.image === "string" && product.image.trim()) {
			const img = processImageUrl(product.image);
			if (img) return img;
		}

		const variantImages: string[] = (product.variants || [])
			.flatMap((variant) => {
				const variantImageSet = variant as {
					image?: string;
					images?: string[];
					variantImages?: string[];
				};
				return [
					variantImageSet.image,
					...(Array.isArray(variantImageSet.images)
						? variantImageSet.images
						: []),
					...(Array.isArray(variantImageSet.variantImages)
						? variantImageSet.variantImages
						: []),
				];
			})
			.filter(
				(img): img is string =>
					!!img && typeof img === "string" && img.trim() !== ""
			)
			.map(processImageUrl)
			.filter((img): img is string => !!img);
		if (variantImages.length > 0) return variantImages[0]!;

		return "/assets/logo.webp";
	};

	return (
		<div className="dashboard__card vendor-product__table-container">
			<table className="dashboard__table vendor-product__table">
				<thead className="dashboard__table-header vendor-product__table-head">
					<tr>
						<th>Image</th>
						<th>Product Name</th>
						<th>Category</th>
						{showVendor && <th>Vendor</th>}
						<th>Price</th>
						<th>Stock</th>
						<th>Deal</th>
						<th>Variants</th>
						<th>Status</th>
						<th>Action</th>
					</tr>
				</thead>
				<tbody>
					{products.length === 0 ? (
						<tr>
							<td
								colSpan={showVendor ? 10 : 9}
								className="empty-state"
							>
								No products found matching your criteria
							</td>
						</tr>
					) : (
						products.map((product) => {
							let numericStock = 0;
							let displayPrice = 0;
							const displayImage = getDisplayImage(product);
							const productMeta = product as Product & {
								hasVariants?: boolean;
								deal?: { id?: number | string };
							};
							const hasVariants =
								(Array.isArray(product.variants) && product.variants.length > 0) ||
								Boolean(productMeta.hasVariants);
							const hasDeal = Boolean(
								product.dealId || productMeta.deal?.id
							);

							if (product.variants && product.variants.length > 0) {
								const firstVariant = product.variants[0] as {
									stock?: number;
									price?: number | string;
									originalPrice?: number | string;
									basePrice?: number | string;
									calculatedPrice?: number;
									discount?: number | string;
									discountType?: string;
								};
								numericStock = (firstVariant?.stock ??
									product.stock ??
									0) as number;

								const variantBase = (firstVariant?.price ??
									firstVariant?.originalPrice ??
									firstVariant?.basePrice ??
									product.basePrice ??
									product.price) as number | string | undefined;
								const hasCalculated =
									typeof firstVariant?.calculatedPrice === "number" &&
									isFinite(firstVariant.calculatedPrice);

								if (hasCalculated) {
									displayPrice = firstVariant.calculatedPrice as number;
								} else if (
									firstVariant?.discount &&
									firstVariant?.discountType
								) {
									displayPrice = calculatePrice(
										variantBase ?? 0,
										String(firstVariant.discount),
										String(firstVariant.discountType)
									);
								} else if (product.discount && product.discountType) {
									displayPrice = calculatePrice(
										variantBase ?? 0,
										String(product.discount),
										String(product.discountType)
									);
								} else {
									displayPrice =
										typeof variantBase === "string"
											? parseFloat(variantBase)
											: Number(variantBase) || 0;
								}
							} else {
								numericStock = product.stock ?? 0;
								displayPrice = calculatePrice(
									product.price,
									product.discount,
									product.discountType
								);
							}

							const status = String(product.status || "").toUpperCase();
							const statusLabel =
								status === "OUT_OF_STOCK"
									? "Out of Stock"
									: status === "LOW_STOCK"
										? "Low Stock"
										: "Available";
							const statusClass =
								status === "OUT_OF_STOCK"
									? "vendor-product__status-badge--out"
									: status === "LOW_STOCK"
										? "vendor-product__status-badge--low"
										: "vendor-product__status-badge--available";

							return (
								<tr
									key={product.id}
									className="dashboard__table-row vendor-product__table-row"
								>
									<td>
										<div
											className="product-cell__icon vendor-product__image"
											style={{
												backgroundImage: `url(${displayImage})`,
												backgroundSize: "cover",
												backgroundPosition: "center",
											}}
										></div>
									</td>
									<td>{product.name || "Unnamed Product"}</td>
									<td>
										{product.subcategory?.name || product.category || "Unknown"}
									</td>
									{showVendor && <td>{product.vendor || "Unknown"}</td>}
									<td>
										Rs. {displayPrice.toFixed(2)}
										{hasVariants ? " (from)" : ""}
									</td>
									<td>{numericStock}</td>
									<td>
										<span
											className={`vendor-product__yn-badge ${
												hasDeal
													? "vendor-product__yn-badge--yes"
													: "vendor-product__yn-badge--no"
											}`}
										>
											{hasDeal ? "Yes" : "No"}
										</span>
									</td>
									<td>
										<span
											className={`vendor-product__yn-badge ${
												hasVariants
													? "vendor-product__yn-badge--yes"
													: "vendor-product__yn-badge--no"
											}`}
										>
											{hasVariants ? "Yes" : "No"}
										</span>
									</td>
									<td>
										<span className={`vendor-product__status-badge ${statusClass}`}>
											{statusLabel}
										</span>
									</td>
									<td>
										<div className="vendor-product__actions-cell">
											<button
												className="vendor-product__action-button vendor-product__action-btn--edit"
												onClick={() => onEdit(product)}
												title="Edit Product"
											>
												<span className="vendor-product__edit-icon"></span>
											</button>
											<button
												className="vendor-product__action-button vendor-product__action-btn--delete"
												onClick={() => onDelete(product)}
												title="Delete Product"
											>
												<span className="vendor-product__delete-icon"></span>
											</button>
										</div>
									</td>
								</tr>
							);
						})
					)}
				</tbody>
			</table>
		</div>
	);
};

export default ProductList;
