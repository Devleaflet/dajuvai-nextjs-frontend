'use client';

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Pagination from "@/components/Components/Pagination";
import DeleteModal from "@/components/Components/Modal/DeleteModal";
import AdminAddProductModal from "@/components/Components/Modal/AdminAddProductModal";
import EditProductModal from "@/components/Components/Modal/EditProductModalRedesigned";
import { useAuth } from "@/lib/context/AuthContext";
import ProductService from "@/lib/services/productService";
import "@/styles/AdminProduct.css";
import { toast } from "react-hot-toast";
import { ApiProduct } from "@/components/Components/Types/ApiProduct";
import { ProductFormData } from "@/lib/types/product";
import { API_BASE_URL } from "@/lib/config";

const SORT_QUERY_MAP: Record<string, string> = {
  newest: "newest",
  oldest: "oldest",
  "price-asc": "price_low_high",
  "price-desc": "price_high_low",
};

type AdminProductRecord = ApiProduct & {
  createdAt?: string;
  discountPercent?: number | string | null;
  vendorName?: string;
  vendor?: ApiProduct["vendor"] & { name?: string };
};

type VendorOption = {
  id?: number;
  value: string;
  label: string;
};

const buildVendorOptionsFromProducts = (items: ApiProduct[]): VendorOption[] => {
  const options = new Map<string, VendorOption>();

  items.forEach((item) => {
    const productRecord = item as AdminProductRecord;
    const vendorId =
      typeof item.vendorId === "number"
        ? item.vendorId
        : typeof productRecord.vendor?.id === "number"
          ? productRecord.vendor.id
          : undefined;

    const vendorLabel =
      item.vendor?.businessName ||
      productRecord.vendor?.name ||
      productRecord.vendorName ||
      "";

    const normalizedLabel = vendorLabel.trim();
    if (!normalizedLabel) return;

    const value =
      typeof vendorId === "number" && vendorId > 0
        ? `id:${vendorId}`
        : `name:${normalizedLabel}`;

    if (!options.has(value)) {
      const option: VendorOption = {
        value,
        label: normalizedLabel,
      };

      if (typeof vendorId === "number" && vendorId > 0) {
        option.id = vendorId;
      }

      options.set(value, option);
    }
  });

  return Array.from(options.values()).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
};

const buildVendorOptionsFromResponse = (payload: unknown): VendorOption[] => {
  const response = payload as {
    data?:
      | Array<{ id?: number; businessName?: string; name?: string }>
      | {
        vendors?: Array<{ id?: number; businessName?: string; name?: string }>;
      };
    vendors?: Array<{ id?: number; businessName?: string; name?: string }>;
  };

  const rawVendors = Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response?.vendors)
      ? response.vendors
      : Array.isArray(response?.data?.vendors)
        ? response.data.vendors
        : [];

  const uniqueOptions = new Map<string, VendorOption>();

  rawVendors.forEach((vendor) => {
    const vendorId =
      typeof vendor?.id === "number" && vendor.id > 0 ? vendor.id : undefined;
    const vendorLabel =
      (vendor?.businessName || vendor?.name || "").toString().trim();

    if (!vendorLabel) return;

    const option: VendorOption = {
      value: vendorId ? `id:${vendorId}` : `name:${vendorLabel}`,
      label: vendorLabel,
    };

    if (vendorId) {
      option.id = vendorId;
    }

    if (!uniqueOptions.has(option.value)) {
      uniqueOptions.set(option.value, option);
    }
  });

  return Array.from(uniqueOptions.values()).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
};

const SkeletonRow: React.FC = () => (
  <tr>
    {[...Array(10)].map((_, i) => (
      <td key={i}>
        <div className="skeleton skeleton-text" />
      </td>
    ))}
  </tr>
);

const formatRelativeDate = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const diffInSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units: Array<{ unit: Intl.RelativeTimeFormatUnit; seconds: number }> = [
    { unit: "year", seconds: 60 * 60 * 24 * 365 },
    { unit: "month", seconds: 60 * 60 * 24 * 30 },
    { unit: "day", seconds: 60 * 60 * 24 },
    { unit: "hour", seconds: 60 * 60 },
    { unit: "minute", seconds: 60 },
  ];

  for (const { unit, seconds } of units) {
    if (Math.abs(diffInSeconds) >= seconds) {
      return formatter.format(Math.round(diffInSeconds / seconds), unit);
    }
  }

  return formatter.format(diffInSeconds, "second");
};

const getDisplayPrice = (product: ApiProduct): number => {
  if (product.basePrice) {
    const price = typeof product.basePrice === "number"
      ? product.basePrice
      : parseFloat(product.basePrice as string);
    if (!Number.isNaN(price) && price > 0) return price;
  }

  if (product.price) {
    const price = typeof product.price === "number"
      ? product.price
      : parseFloat(product.price as string);
    if (!Number.isNaN(price) && price > 0) return price;
  }

  if (product.variants && product.variants.length > 0) {
    for (const variant of product.variants) {
      const price = typeof variant.price === "number"
        ? variant.price
        : parseFloat(variant.price as string);
      if (!Number.isNaN(price) && price > 0) return price;
    }
  }

  return 0;
};

const getDisplayStock = (product: ApiProduct): number => {
  if (product.stock !== undefined) {
    const stock = typeof product.stock === "number"
      ? product.stock
      : parseInt(product.stock as string, 10);
    if (!Number.isNaN(stock) && stock >= 0) return stock;
  }

  if (product.variants && product.variants.length > 0) {
    for (const variant of product.variants) {
      const stock = typeof variant.stock === "number"
        ? variant.stock
        : parseInt(variant.stock as string, 10);
      if (!Number.isNaN(stock) && stock >= 0) return stock;
    }
  }

  return 0;
};

const getDisplayStatus = (product: ApiProduct): string => {
  const rawStatus = String(product.status || "").trim().toUpperCase();
  if (rawStatus) return rawStatus;
  return getDisplayStock(product) > 0 ? "AVAILABLE" : "OUT_OF_STOCK";
};

const AdminProduct: React.FC = () => {
  const { token, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(7);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ApiProduct | null>(null);
  const [productToEdit, setProductToEdit] = useState<ApiProduct | null>(null);
  const [sortOption, setSortOption] = useState<string>("newest");
  const [filterOption, setFilterOption] = useState<string>("all");
  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const [vendorOptions, setVendorOptions] = useState<VendorOption[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchProducts = useCallback(async () => {
    if (!token || !isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      queryParams.set("page", "1");
      queryParams.set("limit", "500");

      if (searchQuery.trim()) {
        queryParams.set("search", searchQuery.trim());
      }

      const response = await fetch(`${API_BASE_URL}/api/categories/all/products?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const fetchedProducts = Array.isArray(data?.data)
          ? (data.data as ApiProduct[])
          : [];

        setProducts(fetchedProducts);

        const fallbackOptions = buildVendorOptionsFromProducts(fetchedProducts);
        if (fallbackOptions.length > 0) {
          setVendorOptions((current) =>
            current.length > 0 ? current : fallbackOptions
          );
        }
      } else {
        throw new Error(data.message || "Failed to fetch products");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load products";
      console.error("Fetch products error:", err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (!token || !isAuthenticated) return;

    let active = true;

    const fetchVendors = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/vendors`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        const options = buildVendorOptionsFromResponse(data);

        if (active && options.length > 0) {
          setVendorOptions(options);
        }
      } catch (err) {
        console.error("Failed to fetch vendor options:", err);
      }
    };

    fetchVendors();

    return () => {
      active = false;
    };
  }, [token, isAuthenticated]);

  const vendorNameById = useMemo(() => {
    const map = new Map<number, string>();

    vendorOptions.forEach((vendor) => {
      if (typeof vendor.id === "number" && vendor.id > 0) {
        map.set(vendor.id, vendor.label);
      }
    });

    return map;
  }, [vendorOptions]);

  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      if (filterOption === "out_of_stock") {
        const status = getDisplayStatus(product);
        const stock = getDisplayStock(product);
        if (status !== "OUT_OF_STOCK" && stock > 0) {
          return false;
        }
      }

      if (vendorFilter !== "all") {
        const productRecord = product as AdminProductRecord;
        const vendorId =
          typeof product.vendorId === "number"
            ? product.vendorId
            : typeof productRecord.vendor?.id === "number"
              ? productRecord.vendor.id
              : undefined;

        const vendorName =
          product.vendor?.businessName ||
          productRecord.vendor?.name ||
          productRecord.vendorName ||
          "";

        if (vendorFilter.startsWith("id:")) {
          if (String(vendorId) !== vendorFilter.replace("id:", "")) {
            return false;
          }
        } else if (vendorFilter.startsWith("name:")) {
          if (vendorName.trim().toLowerCase() !== vendorFilter.replace("name:", "").toLowerCase()) {
            return false;
          }
        }
      }

      return true;
    });

    return filtered.sort((a, b) => {
      if (sortOption === "oldest") {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      }

      if (sortOption === "price-asc") {
        return getDisplayPrice(a) - getDisplayPrice(b);
      }

      if (sortOption === "price-desc") {
        return getDisplayPrice(b) - getDisplayPrice(a);
      }

      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }, [products, filterOption, vendorFilter, sortOption]);

  const visibleTotalProducts = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(visibleTotalProducts / productsPerPage));
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    return filteredProducts.slice(startIndex, startIndex + productsPerPage);
  }, [filteredProducts, currentPage, productsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSaveProduct = useCallback(
    async (...args: [number, ProductFormData, number, number]) => {
      void args;
      try {
        setIsUpdating(true);
        await fetchProducts();
        setShowEditModal(false);
        setProductToEdit(null);
      } catch (err: unknown) {
        console.error("AdminProduct: Error refreshing after update:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to refresh products";
        toast.error(errorMessage);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [fetchProducts]
  );

  const handleAddProduct = useCallback(
    async (
      productData: ProductFormData,
      categoryId: number,
      subcategoryId: number,
      authToken: string,
      _role: "admin" | "vendor"
    ) => {
      try {
        setIsCreating(true);
        await ProductService.createProduct(categoryId, subcategoryId, productData, authToken);
        await fetchProducts();
        setShowAddModal(false);
        toast.success("Product created successfully");
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to create product";
        toast.error(errorMessage);
        throw err;
      } finally {
        setIsCreating(false);
      }
    },
    [fetchProducts]
  );

  const deleteProduct = useCallback(async (product: ApiProduct) => {
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    setIsDeleting(true);
    try {
      await ProductService.deleteProduct(product.id, token);
      await fetchProducts();
      setShowDeleteModal(false);
      setProductToDelete(null);
      toast.success("Product deleted successfully");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete product";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  }, [token, fetchProducts]);

  const handleSort = useCallback((newSortOption: string) => {
    setSortOption(newSortOption);
    setCurrentPage(1);
  }, []);

  const handleFilter = useCallback((newFilterOption: string) => {
    setFilterOption(newFilterOption);
    setCurrentPage(1);
  }, []);

  const handleVendorFilter = useCallback((newVendor: string) => {
    setVendorFilter(newVendor);
    setCurrentPage(1);
  }, []);

  const handleEditProduct = useCallback((product: ApiProduct) => {
    setProductToEdit(product);
    setShowEditModal(true);
  }, []);

  const handleDeleteProduct = useCallback(async () => {
    if (!productToDelete) return;

    try {
      await deleteProduct(productToDelete);
    } catch (err: unknown) {
      console.error("AdminProduct: Error deleting product:", err);
    }
  }, [productToDelete, deleteProduct]);

  if (!isAuthenticated || !token) {
    return (
      <div className="admin-products">
        <div className="admin-products__content">
          <div className="admin-products__error">
            Please log in to access product management.
          </div>
        </div>
      </div>
    );
  }

  const showingFrom = visibleTotalProducts === 0 ? 0 : (currentPage - 1) * productsPerPage + 1;
  const showingTo = visibleTotalProducts === 0
    ? 0
    : Math.min(currentPage * productsPerPage, visibleTotalProducts);

  return (
    <div className="admin-products">
      <div className="admin-products__content">
        {error && (
          <div className="admin-products__error">
            {error}
            <button onClick={fetchProducts}>Retry</button>
          </div>
        )}

        <div className="admin-products__controls">
          <div className="admin-products__search-wrapper">
            <svg
              className="admin-products__search-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="11" cy="11" r="8" stroke="#9CA3AF" strokeWidth="2" />
              <path d="M21 21L16.65 16.65" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              className="admin-products__search-input"
              placeholder="Search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <select
            className="admin-products__select admin-products__select--sort"
            value={sortOption}
            onChange={(e) => handleSort(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>

          <select
            className="admin-products__select admin-products__select--product"
            value={filterOption}
            onChange={(e) => handleFilter(e.target.value)}
          >
            <option value="all">All Products</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          <select
            className="admin-products__select admin-products__select--vendor"
            value={vendorFilter}
            onChange={(e) => handleVendorFilter(e.target.value)}
          >
            <option value="all">All vendors</option>
            {vendorOptions.map((vendor) => (
              <option key={vendor.value} value={vendor.value}>
                {vendor.label}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-products__list-container">
          <div className="admin-products__header">
            <h2>Product Management</h2>
            <div className="admin-products__header-actions">
              <button
                type="button"
                className="admin-products__create-button"
                onClick={() => setShowAddModal(true)}
                disabled={isCreating}
              >
                <span className="admin-products__create-icon" aria-hidden="true">+</span>
                <span className="font-medium">Create Product</span>
              </button>
              <div className="admin-products__stats">
                <span>Total: {visibleTotalProducts} products</span>
              </div>
            </div>
          </div>

          <div className="admin-products__table-container">
            <table className="admin-products__table">
              <thead className="admin-products__table-head">
                <tr>
                  <th>Image</th>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Vendor</th>
                  <th>Price</th>
                  <th>Variants</th>
                  <th>Discount</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(productsPerPage)].map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                ) : filteredProducts.length > 0 ? (
                  paginatedProducts.map((product) => {
                    const productRecord = product as AdminProductRecord;
                    const displayPrice = getDisplayPrice(product);
                    const displayStock = getDisplayStock(product);
                    const variantCount = product.variants?.length ?? 0;

                    const firstVariant =
                      product.hasVariants && product.variants?.length
                        ? product.variants[0]
                        : null;

                    const variantImage = firstVariant
                      ? (
                        (Array.isArray(firstVariant.variantImages) && typeof firstVariant.variantImages[0] === "string"
                          ? (firstVariant.variantImages[0] as string)
                          : undefined) ||
                        (Array.isArray(firstVariant.images) && typeof firstVariant.images[0] === "string"
                          ? (firstVariant.images[0] as string)
                          : undefined)
                      )
                      : undefined;

                    const displayImage =
                      product.productImages?.[0] || variantImage || "/assets/logo.webp";

                    const statusLabel = getDisplayStatus(product)
                      .replace(/\s+/g, "_")
                      .toUpperCase();

                    const discount = product.discount ?? productRecord.discountPercent ?? null;
                    const numericDiscount = discount == null ? NaN : Number(discount);
                    const discountLabel =
                      Number.isFinite(numericDiscount) && numericDiscount > 0
                        ? product.discountType === "FLAT"
                          ? `Rs ${numericDiscount.toFixed(2)}`
                          : `${numericDiscount.toFixed(2)}%`
                        : null;

                    const createdAt = formatRelativeDate(
                      productRecord.createdAt || product.created_at
                    );

                    const fallbackVendorId =
                      typeof product.vendorId === "number"
                        ? product.vendorId
                        : typeof productRecord.vendor?.id === "number"
                          ? productRecord.vendor.id
                          : undefined;

                    const vendorName =
                      product.vendor?.businessName ||
                      productRecord.vendor?.name ||
                      productRecord.vendorName ||
                      (typeof fallbackVendorId === "number"
                        ? vendorNameById.get(fallbackVendorId)
                        : undefined) ||
                      "-";

                    return (
                      <tr
                        key={product.id}
                        className={`admin-products__table-row ${displayStock === 0 ? "out-of-stock" : ""}`}
                      >
                        <td className="admin-products__image-cell">
                          <img
                            src={displayImage}
                            alt={product.name}
                            className="admin-products__product-image"
                          />
                        </td>
                        <td className="admin-products__id-cell">{product.id}</td>
                        <td className="admin-products__name-cell">{product.name}</td>
                        <td className="admin-products__vendor-cell">{vendorName}</td>
                        <td className="admin-products__price-cell">
                          Rs. {(typeof displayPrice === "number" ? displayPrice : Number(displayPrice)).toFixed(2)}
                        </td>
                        <td className="admin-products__variant-cell">
                          <span className="admin-products__variant-badge">
                            {variantCount > 0 ? `${variantCount} variant${variantCount > 1 ? "s" : ""}` : "-"}
                          </span>
                        </td>
                        <td className="admin-products__discount-cell">
                          {discountLabel ? (
                            <span className="admin-products__discount-badge">{discountLabel}</span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="admin-products__status-cell">
                          <span className={`admin-products__status-badge status-${statusLabel.toLowerCase()}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="admin-products__created-cell">{createdAt}</td>
                        <td className="admin-products__actions-cell">
                          <div className="admin-products__actions">
                            <button
                              className="admin-products__action-btn admin-products__edit-btn"
                              onClick={() => handleEditProduct(product)}
                              disabled={isUpdating}
                              aria-label="Edit product"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M18.5 2.50023C18.8978 2.10243 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.10243 21.5 2.50023C21.8978 2.89804 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.10243 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            <button
                              className="admin-products__action-btn admin-products__delete-btn"
                              onClick={() => {
                                setProductToDelete(product);
                                setShowDeleteModal(true);
                              }}
                              disabled={isDeleting}
                              aria-label="Delete product"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="admin-products__no-data">
                      {searchQuery || filterOption !== "all" || vendorFilter !== "all"
                        ? "No products match the current search/filter."
                        : "No products found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-products__pagination-container">
            <div className="admin-products__pagination-info">
              Showing {showingFrom}-{showingTo} out of {visibleTotalProducts}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>

      <AdminAddProductModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddProduct}
        role="admin"
      />
      <EditProductModal
        show={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setProductToEdit(null);
        }}
        onSave={handleSaveProduct}
        product={productToEdit}
      />
      <DeleteModal
        show={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setProductToDelete(null);
        }}
        onDelete={handleDeleteProduct}
        productName={productToDelete?.name || "Product"}
        title="Delete Product"
        description="This will permanently remove the product and all its images. This action cannot be undone."
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default AdminProduct;
