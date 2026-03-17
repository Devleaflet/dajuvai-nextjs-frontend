'use client';

// Cart.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Drawer } from "antd";
import {
	FaTimes,
	FaShoppingBag,
	FaPlus,
	FaMinus,
	FaTrash,
	FaExclamationCircle,
} from "react-icons/fa";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/context/CartContext";
import { useUI } from "@/lib/context/UIContext";
import '@/styles/Cart.css';

interface CartProps {
	cartOpen: boolean;
	toggleCart: (e?: React.MouseEvent) => void;
	cartButtonRef: React.RefObject<HTMLButtonElement | null>;
	stableCartItems: any[];
}

interface ErrorState {
	itemId: string;
	message: string;
	type: "delete" | "quantity" | "stock";
}

const Cart: React.FC<CartProps> = ({ cartOpen, toggleCart }) => {
	const {
		handleCartItemOnDelete,
		handleIncreaseQuantity,
		handleDecreaseQuantity,
		updatingItems,
		cartItems,
	} = useCart();

	const { setCartOpen } = useUI();
	const pathname = usePathname();
	const prevLocationRef = useRef(pathname);

	const [errors, setErrors] = useState<ErrorState[]>([]);
	const [isProcessing, setIsProcessing] = useState<Set<string>>(new Set());

	// ✅ FIXED: Only auto-close when NAVIGATING TO /checkout from another page
	useEffect(() => {
		const currentPath = pathname;
		const prevPath = prevLocationRef.current;

		// Only close cart if we're navigating TO checkout from a different page
		// AND the cart is currently open
		if (cartOpen && currentPath === '/checkout' && prevPath !== '/checkout') {
			setCartOpen(false);
		}

		// Update the previous location reference
		prevLocationRef.current = currentPath;
	}, [pathname, cartOpen, setCartOpen]);

	useEffect(() => {
		if (errors.length > 0) {
			const timer = setTimeout(() => {
				setErrors([]);
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [errors]);

	const addError = useCallback(
		(itemId: string, message: string, type: ErrorState["type"]) => {
			setErrors((prev) => {
				const filtered = prev.filter((error) => error.itemId !== itemId);
				return [...filtered, { itemId, message, type }];
			});
		},
		[]
	);

	const clearError = useCallback((itemId: string) => {
		setErrors((prev) => prev.filter((error) => error.itemId !== itemId));
	}, []);

	const formatAttributes = useCallback((attrs: any): string => {
		if (!attrs) return "";
		if (Array.isArray(attrs)) {
			return attrs
				.map((a) => {
					if (!a) return "";
					if (typeof a === "string") return a;
					if (typeof a === "object") {
						const key = a.key || a.name || a.attribute || Object.keys(a)[0];
						const value = a.value || a.val || a.option || a[key];
						return [key, value].filter(Boolean).join(": ");
					}
					return String(a);
				})
				.filter(Boolean)
				.join(", ");
		}
		if (typeof attrs === "object") {
			return Object.entries(attrs)
				.map(([k, v]) => `${k}: ${v}`)
				.join(", ");
		}
		return String(attrs);
	}, []);

	const getCartVariantLabel = useCallback((item: any): string | null => {
		try {
			const name = item?.variant?.name || item?.selectedVariant?.name;
			if (name && typeof name === "string") return name;

			const candidates = [
				item?.variant?.attributes,
				item?.variant?.attributeValues,
				item?.variant?.attrs,
				item?.variant?.attributeSpecs,
				item?.variantAttributes,
				item?.attributes,
			];

			for (const c of candidates) {
				if (!c) continue;
				const formatted = formatAttributes(c);
				if (formatted) return formatted;
			}

			const sku = item?.variant?.sku || item?.sku || item?.variantSku;
			if (sku) return `SKU: ${sku}`;
		} catch (error) {
			console.error("Error getting variant label:", error);
		}
		return null;
	}, [formatAttributes]);

	const handleDeleteItem = useCallback(
		async (item: any, e?: React.MouseEvent) => {
			if (e) {
				e.preventDefault();
				e.stopPropagation();
			}

			const rawItemId = item.lineItemId ?? item.id ?? item.itemId;
			const itemId = rawItemId != null ? String(rawItemId) : "";
			const numericItemId = Number(rawItemId);
			if (!itemId) {
				console.error("No valid item ID found for deletion:", item);
				addError(
					itemId || "unknown",
					"Unable to remove item - invalid ID",
					"delete"
				);
				return;
			}

			clearError(itemId);
			setIsProcessing((prev) => new Set(prev).add(itemId));

			try {
				await handleCartItemOnDelete(item);
			} catch (error) {
				console.error("Delete failed, trying quantity 0 fallback:", error);

				try {
					if (!Number.isNaN(numericItemId)) {
						await handleDecreaseQuantity(numericItemId, item.quantity);
					}
					//("Successfully removed item via quantity 0");
				} catch (quantityError) {
					console.error("Quantity fallback also failed:", quantityError);
					addError(
						itemId,
						"Unable to remove item. Please try again.",
						"delete"
					);
				}
			} finally {
				setTimeout(() => {
					setIsProcessing((prev) => {
						const newSet = new Set(prev);
						newSet.delete(itemId);
						return newSet;
					});
				}, 100);
			}
		},
		[handleCartItemOnDelete, handleDecreaseQuantity, addError, clearError]
	);

	const getItemError = useCallback(
		(itemId: string) => {
			return errors.find((error) => error.itemId === itemId);
		},
		[errors]
	);

	const orderedCartItems = React.useMemo(() => {
		return [...cartItems];
	}, [cartItems]);

	const subtotal = React.useMemo(() => {
		return cartItems.reduce(
			(total, item) => total + item.price * item.quantity,
			0
		);
	}, [cartItems]);

	const CartItem = React.memo(
		({ item }: { item: any }) => {
			const rawItemId = item.lineItemId ?? item.id ?? item.itemId;
			const itemId = rawItemId != null ? String(rawItemId) : "";
			const numericItemId = Number(rawItemId);
			const isUpdating =
				(!Number.isNaN(numericItemId) && updatingItems?.has?.(numericItemId)) ||
				isProcessing.has(itemId);
			const itemError = getItemError(itemId);
			const variantLabel = getCartVariantLabel(item);

			const [localQuantity, setLocalQuantity] = useState(item.quantity);
			const [isLocalUpdating, setIsLocalUpdating] = useState(false);

			useEffect(() => {
				setLocalQuantity(item.quantity);
			}, [item.quantity]);

			const handleLocalIncrease = useCallback(
				async (e: React.MouseEvent) => {
					e.preventDefault();
					e.stopPropagation();

					setIsLocalUpdating(true);
					setLocalQuantity((prev: number) => prev + 1);

					try {
						if (!Number.isNaN(numericItemId)) {
							await handleIncreaseQuantity(numericItemId, 1);
						}
					} catch (error) {
						setLocalQuantity(item.quantity);
						console.error("Error increasing quantity:", error);

						const errorMessage =
							error instanceof Error
								? error.message.toLowerCase()
								: "";
						if (
							errorMessage.includes("stock") ||
							errorMessage.includes("inventory") ||
							errorMessage.includes("available")
						) {
							addError(itemId, "Not enough stock available", "stock");
						} else {
							addError(
								itemId,
								"Unable to update quantity. Please try again.",
								"quantity"
							);
						}
					} finally {
						setIsLocalUpdating(false);
					}
				},
				[itemId, numericItemId, item.quantity]
			);

			const handleLocalDecrease = useCallback(
				async (e: React.MouseEvent) => {
					e.preventDefault();
					e.stopPropagation();

					if (localQuantity <= 1) {
						await handleDeleteItem(item, e);
						return;
					}

					setIsLocalUpdating(true);
					setLocalQuantity((prev: number) => prev - 1);

					try {
						if (!Number.isNaN(numericItemId)) {
							await handleDecreaseQuantity(numericItemId, 1);
						}
					} catch (error) {
						setLocalQuantity(item.quantity);
						console.error("Error decreasing quantity:", error);
						addError(
							itemId,
							"Unable to update quantity. Please try again.",
							"quantity"
						);
					} finally {
						setIsLocalUpdating(false);
					}
				},
				[itemId, numericItemId, item, localQuantity]
			);

			return (
				<div
					className={`bg-white rounded-xl p-4 shadow-[0_2px_6px_rgba(0,0,0,0.05)] border border-[#e2e8f0] transition-all duration-200 flex gap-4 relative overflow-visible min-h-auto ${isUpdating || isLocalUpdating ? 'pointer-events-none' : 'hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-px'} ${itemError ? 'border-[#fecaca] bg-[#fefefe]' : ''} sm:p-[14px] sm:gap-3 sm:rounded-[10px] xs:p-3 xs:gap-[10px] xs:rounded-lg`}
				>
					{itemError && (
						<div
							className={`absolute -top-px -left-px -right-px bg-[#fef2f2] border border-[#fecaca] rounded-t-xl p-[10px_12px] flex items-center gap-2 text-[0.8rem] text-[#dc2626] z-[5] animate-slide-in-error ${itemError.type === 'stock' ? 'bg-[#fef3c7] border-[#fbbf24] text-[#92400e]' : ''} sm:rounded-t-[10px] sm:p-[8px_10px] sm:text-xs xs:rounded-t-lg xs:p-[6px_8px] xs:text-[0.7rem]`}
						>
							<FaExclamationCircle className={`text-xs flex-shrink-0 ${itemError.type === 'stock' ? 'text-[#f59e0b]' : ''}`} />
							<span className="flex-1 font-medium">{itemError.message}</span>
							<button
								className="bg-none border-none text-inherit cursor-pointer p-[2px] rounded-[2px] text-[0.7rem] opacity-70 flex-shrink-0 select-none transition-opacity duration-200 hover:opacity-100"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									clearError(itemId);
								}}
								aria-label="Dismiss error"
							>
								<FaTimes />
							</button>
						</div>
					)}

					<div className={`flex-shrink-0 w-[70px] h-[70px] rounded-lg overflow-hidden bg-[#f8fafc] border border-[#e2e8f0] transition-all duration-200 ${itemError ? 'mt-[35px]' : ''} sm:w-[60px] sm:h-[60px] sm:mt-[30px] xs:w-[50px] xs:h-[50px] xs:mt-7`}>
						<img
							src={item.image || "../assets/iphone.jpg"}
							alt={item.name}
							className="w-full h-full object-cover transition-opacity duration-200"
							onError={(e) => {
								const target = e.target as HTMLImageElement;
								target.src = "../assets/iphone.jpg";
							}}
						/>
					</div>

					<div className={`flex-1 flex flex-col gap-2 min-w-0 transition-all duration-200 overflow-visible ${itemError ? 'mt-[35px]' : ''} sm:mt-[30px] xs:gap-[6px] xs:mt-7`}>
						<div className="flex items-start justify-between gap-[10px]">
							<h4 className="text-[0.95rem] font-semibold text-[#1a202c] m-0 leading-[1.4] flex-1 line-clamp-2 transition-colors duration-200 min-h-[2.8em] sm:text-[0.9rem] sm:min-h-[2.6em] xs:text-[0.85rem] xs:min-h-[2.4em]">{item.name}</h4>
							<button
								className="bg-[#fef2f2] border border-[#fecaca] rounded-md w-7 h-7 flex items-center justify-center cursor-pointer text-[#dc2626] text-[0.7rem] transition-all duration-200 flex-shrink-0 select-none hover:bg-[#dc2626] hover:text-white hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-2 focus:outline-[#f97316] focus:outline-offset-2 focus:shadow-[0_0_0_2px_rgba(249,115,22,0.3)] sm:w-8 sm:h-8 sm:text-[0.8rem]"
								aria-label="Remove item"
								onClick={(e) => handleDeleteItem(item, e)}
								disabled={isUpdating || isLocalUpdating}
							>
								{isUpdating || isLocalUpdating ? (
									<div className="w-[14px] h-[14px] border-2 border-transparent border-t-current rounded-full animate-spin"></div>
								) : (
									<FaTrash />
								)}
							</button>
						</div>

						{variantLabel && (
							<div className="text-xs text-[#64748b] bg-[#f8fafc] px-2 py-[5px] rounded border border-[#e2e8f0] leading-[1.3] transition-all duration-200 min-h-[1.5em] break-words xs:text-[0.7rem] xs:px-[6px] xs:py-1 xs:min-h-[1.3em]">{variantLabel}</div>
						)}

						<div className="flex items-center justify-between gap-3 mt-[6px] flex-wrap sm:gap-2 xs:flex-row xs:items-center xs:justify-between xs:gap-[6px] xs:mt-1 xs:flex-nowrap">
							<div className="text-base font-bold text-[#f97316] whitespace-nowrap transition-colors duration-200 flex-shrink-0 sm:text-[0.95rem] xs:text-[0.9rem]">
								Rs. {item.price.toLocaleString("en-IN")}
							</div>

							<div className="flex items-center gap-3 flex-shrink-0 sm:gap-2 xs:w-auto xs:justify-end xs:flex-shrink-0">
								<div className="flex items-center bg-[#f8fafc] border border-[#e2e8f0] rounded-lg overflow-hidden min-w-0 flex-shrink transition-all duration-200 hover:border-[#cbd5e1] hover:shadow-[0_0_0_1px_rgba(249,115,22,0.1)] sm:rounded-md xs:rounded-md">
									<button
										type="button"
										aria-label={
											localQuantity <= 1 ? "Remove item" : "Decrease quantity"
										}
										className="bg-white border-none w-8 h-8 flex items-center justify-center cursor-pointer text-[#475569] text-[0.8rem] transition-all duration-150 flex-shrink-0 relative select-none border-r border-[#e2e8f0] hover:bg-[#f1f5f9] hover:text-[#1a202c] hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-[#f8fafc] disabled:transform-none focus:outline-2 focus:outline-[#f97316] focus:outline-offset-2 focus:shadow-[0_0_0_2px_rgba(249,115,22,0.3)] sm:w-[30px] sm:h-[30px] sm:text-[0.75rem] xs:w-7 xs:h-7 xs:text-[0.7rem]"
										onClick={handleLocalDecrease}
										disabled={isUpdating || isLocalUpdating}
									>
										{localQuantity <= 1 ? <FaTrash /> : <FaMinus />}
									</button>

									<span
										className={`w-10 text-center text-[0.9rem] font-semibold text-[#1a202c] flex-shrink-0 transition-all duration-200 relative ${isUpdating || isLocalUpdating
											? 'text-[#f97316] animate-pulse-custom'
											: ''
											} sm:w-9 sm:text-[0.85rem] xs:w-8 xs:text-[0.8rem]`}
									>
										{localQuantity}
									</span>

									<button
										type="button"
										aria-label="Increase quantity"
										className="bg-white border-none w-8 h-8 flex items-center justify-center cursor-pointer text-[#475569] text-[0.8rem] transition-all duration-150 flex-shrink-0 relative select-none border-l border-[#e2e8f0] hover:bg-[#f1f5f9] hover:text-[#1a202c] hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-[#f8fafc] disabled:transform-none focus:outline-2 focus:outline-[#f97316] focus:outline-offset-2 focus:shadow-[0_0_0_2px_rgba(249,115,22,0.3)] sm:w-[30px] sm:h-[30px] sm:text-[0.75rem] xs:w-7 xs:h-7 xs:text-[0.7rem]"
										onClick={handleLocalIncrease}
										disabled={isUpdating || isLocalUpdating}
									>
										<FaPlus />
									</button>
								</div>
							</div>
						</div>
					</div>

					{isUpdating && !isLocalUpdating && (
						<div className="absolute top-0 left-0 right-0 bottom-0 bg-white/80 flex items-center justify-center rounded-xl backdrop-blur-[1px] z-10 sm:rounded-[10px] xs:rounded-lg">
							<div className="w-6 h-6 border-[3px] border-[#e2e8f0] border-t-[#f97316] rounded-full animate-spin"></div>
						</div>
					)}
				</div>
			);
		},
		(prevProps, nextProps) => {
			const prevItem = prevProps.item;
			const nextItem = nextProps.item;

			return (
				prevItem.quantity === nextItem.quantity &&
				prevItem.price === nextItem.price &&
				prevItem.name === nextItem.name &&
				prevItem.image === nextItem.image
			);
		}
	);

	CartItem.displayName = "CartItem";

	const handleCloseCart = useCallback(() => {
		toggleCart();
	}, [toggleCart]);

	return (
		<Drawer
			rootClassName="cart-antd-drawer"
			open={cartOpen}
			onClose={handleCloseCart}
			placement="right"
			width={420}
			maskClosable
			keyboard
			closable={false}
			zIndex={9999}
			destroyOnHidden
			styles={{
				body: { padding: 0 },
				mask: { backdropFilter: "blur(2px)", background: "rgba(0, 0, 0, 0.5)" },
				content: {
					background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
					boxShadow: "-4px 0 32px rgba(0, 0, 0, 0.1)",
				},
			}}
		>
			<div className="h-full flex flex-col overflow-hidden">
				<div className="bg-white border-b border-gray-100 sticky top-0 z-10 flex-shrink-0">
					<div className="flex items-center justify-between px-6 py-4">
						<h2 className="flex items-center gap-2 m-0 text-lg font-bold text-gray-800">
							<FaShoppingBag className="text-[#f97316] text-lg" />
							Your Shopping Cart
							{cartItems.length > 0 && (
								<span className="bg-[#f97316] text-white rounded-full min-w-[20px] h-5 flex items-center justify-center text-xs font-bold ml-2">
									{cartItems.length}
								</span>
							)}
						</h2>
						<button
							className="bg-gray-100 border-none rounded-md w-8 h-8 flex items-center justify-center cursor-pointer text-gray-500 text-sm transition-colors hover:bg-gray-200 hover:text-gray-700"
							onClick={() => handleCloseCart()}
							aria-label="Close cart"
							type="button"
						>
							<FaTimes />
						</button>
					</div>
				</div>

				<div className="flex-1 flex flex-col overflow-hidden">
					{cartItems.length === 0 ? (
						<div className="flex flex-col items-center justify-center text-center px-8 flex-1 h-full">
							<div className="w-[80px] h-[80px] bg-orange-100 rounded-full flex items-center justify-center mb-6 text-[#f97316] text-3xl">
								<FaShoppingBag />
							</div>
							<h3 className="text-xl font-bold text-gray-800 m-0 mb-3">Your cart is empty</h3>
							<p className="text-gray-500 text-sm leading-relaxed m-0 mb-8 max-w-[260px]">
								Looks like you haven&apos;t added any items to your cart yet.
							</p>
							<Link
								href="/shop"
								className="bg-[#f97316] text-white no-underline px-8 py-3 rounded-md font-medium text-sm transition-colors hover:bg-[#ea580c] shadow-sm hover:shadow-md"
								onClick={(e) => {
									e.stopPropagation();
									toggleCart();
								}}
							>
								Start Shopping
							</Link>
						</div>
					) : (
						<>
							<div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 sm:p-[18px] sm:gap-[14px] xs:p-[14px] xs:gap-3 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-[#f1f5f9] [&::-webkit-scrollbar-track]:rounded-[2px] [&::-webkit-scrollbar-thumb]:bg-[#cbd5e1] [&::-webkit-scrollbar-thumb]:rounded-[2px] [&::-webkit-scrollbar-thumb:hover]:bg-[#94a3b8]">
								{orderedCartItems.map((item) => {
									const itemId = item.id;
									return (
										<CartItem
											key={itemId}
											item={item}
										/>
									);
								})}
							</div>

							<div className="bg-white border-t border-[#e2e8f0] p-5 flex-shrink-0 shadow-[0_-2px_8px_rgba(0,0,0,0.04)] sm:p-[18px] xs:p-[14px]">
								<div className="flex items-center justify-between mb-[14px] p-[8px_0] border-b border-[#f1f5f9] xs:mb-3 xs:p-[6px_0]">
									<span className="text-base font-semibold text-[#475569] sm:text-[0.95rem] xs:text-[0.9rem]">Subtotal:</span>
									<span className="text-[1.3rem] font-bold text-[#1a202c] whitespace-nowrap sm:text-[1.1rem] xs:text-base">
										Rs. {subtotal.toLocaleString("en-IN")}
									</span>
								</div>

								<div className="text-center text-[0.85rem] text-[#64748b] mb-5 p-2 bg-[#f8fafc] rounded-md border border-[#e2e8f0] xs:mb-4 xs:p-[6px] xs:text-xs">
									Shipping & taxes calculated at checkout
								</div>

								<div className="flex flex-col gap-[10px] xs:gap-2">
									<Link
										href="/checkout"
										className="block text-center no-underline px-5 py-[14px] rounded-lg font-semibold text-[0.95rem] transition-all duration-300 border-none cursor-pointer select-none bg-gradient-to-br from-[#f97316] to-[#ea580c] text-white shadow-[0_4px_12px_rgba(249,115,22,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(249,115,22,0.4)] active:-translate-y-px focus:outline-2 focus:outline-[#f97316] focus:outline-offset-2 focus:shadow-[0_0_0_2px_rgba(249,115,22,0.3)] sm:px-[18px] sm:py-3 sm:text-[0.9rem] xs:px-[14px] xs:py-[10px] xs:text-[0.85rem] xs:rounded-md"
										onClick={(e) => {
											e.stopPropagation();
											toggleCart();
										}}
									>
										Proceed to Checkout
									</Link>

									<Link
										href="/shop"
										className="block text-center no-underline px-5 py-[14px] rounded-lg font-semibold text-[0.95rem] transition-all duration-300 border-none cursor-pointer select-none bg-white text-[#475569] border-2 border-[#e2e8f0] hover:bg-[#f8fafc] hover:border-[#cbd5e1] hover:-translate-y-px active:translate-y-0 focus:outline-2 focus:outline-[#f97316] focus:outline-offset-2 focus:shadow-[0_0_0_2px_rgba(249,115,22,0.3)] sm:px-[18px] sm:py-3 sm:text-[0.9rem] xs:px-[14px] xs:py-[10px] xs:text-[0.85rem] xs:rounded-md"
										onClick={(e) => {
											e.stopPropagation();
											toggleCart();
										}}
									>
										Continue Shopping
									</Link>
								</div>
							</div>
						</>
					)}
				</div>
			</div>
		</Drawer>
	);
};

export default Cart;