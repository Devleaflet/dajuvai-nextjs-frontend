'use client';

import React, { useState, useCallback, useEffect } from "react";
import Pagination from "@/components/Components/Pagination";
import DeleteModal from "@/components/Components/Modal/DeleteModal";
import EditProductModal from "@/components/Components/Modal/EditProductModalRedesigned";
import { useAuth } from "@/lib/context/AuthContext";
import ProductService from "@/lib/services/productService";
import "@/styles/AdminProduct.css";
import { toast } from "react-hot-toast";
import { ApiProduct } from "@/components/Components/Types/ApiProduct";
import { ProductFormData } from "@/lib/types/product";
import { API_BASE_URL } from "@/lib/config";

const SkeletonRow: React.FC = () => (
  <tr>
    {[...Array(10)].map((_, i) => (
      <td key={i}>
        <div className="skeleton skeleton-text" />
      </td>
    ))}
  </tr>
);

const AdminProduct: React.FC = () => {
  const { token, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(7);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ApiProduct | null>(null);
  const [productToEdit, setProductToEdit] = useState<ApiProduct | null>(null);
  const [sortOption, setSortOption] = useState<string>("newest");
  const [filterOption, setFilterOption] = useState<string>("all");
  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch products from backend with pagination, sorting, filtering, and search
  const fetchProducts = useCallback(async () => {
    if (!token || !isAuthenticated) return;

    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: productsPerPage.toString(),
        sort: sortOption,
        ...(filterOption !== "all" && { filter: filterOption }),
        ...(vendorFilter !== "all" && { vendor: vendorFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`${API_BASE_URL}/api/product/admin/products?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setProducts(data.data.products);
        setTotalProducts(data.data.total);
      } else {
        throw new Error(data.message || "Failed to fetch products");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load products";
      console.error('Fetch products error:', err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated, currentPage, productsPerPage, sortOption, filterOption, vendorFilter, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSaveProduct = useCallback(
    async (
      _productId: number,
      _product: ProductFormData,
      _categoryId: number,
      _subcategoryId: number
    ) => {
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
    const backendSortMap: { [key: string]: string } = {
      "newest": "newest",
      "oldest": "oldest",
      "price-asc": "price_low_high",
      "price-desc": "price_high_low",
    };
    setSortOption(backendSortMap[newSortOption] || "newest");
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

  return (
    <div className="admin-products">
      <div className="admin-products__content">
        {error && (
          <div className="admin-products__error">
            {error}
            <button onClick={fetchProducts}>Retry</button>
          </div>
        )}

        <div className="admin-products__list-container">
          <div className="admin-products__header">
            <h2>Product Management</h2>
            <div className="admin-products__stats">
              <span>Total: {totalProducts} products</span>
              {filterOption !== "all" && (
                <span className="filter-indicator">
                  Filtered by: {filterOption.replace('_', ' ').toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* ── Controls below heading ── */}
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
              className="admin-products__select"
              value={sortOption}
              onChange={(e) => handleSort(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>

            <select
              className="admin-products__select"
              value={filterOption}
              onChange={(e) => handleFilter(e.target.value)}
            >
              <option value="all">All Products</option>
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              className="admin-products__select"
              value={vendorFilter}
              onChange={(e) => handleVendorFilter(e.target.value)}
            >
              <option value="all">All vendors</option>
              {/* Populate dynamically if you have vendor list */}
            </select>
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
                ) : products.length > 0 ? (
                  products.map((product) => {
                    // ── Price ──
                    const getDisplayPrice = (): number => {
                      if (product.basePrice) {
                        const p = typeof product.basePrice === 'number'
                          ? product.basePrice
                          : parseFloat(product.basePrice as string);
                        if (!isNaN(p) && p > 0) return p;
                      }
                      if (product.price) {
                        const p = typeof product.price === 'number'
                          ? product.price
                          : parseFloat(product.price as string);
                        if (!isNaN(p) && p > 0) return p;
                      }
                      if (product.variants && product.variants.length > 0) {
                        for (const variant of product.variants) {
                          const p = typeof variant.price === 'number'
                            ? variant.price
                            : parseFloat(variant.price as string);
                          if (!isNaN(p) && p > 0) return p;
                        }
                      }
                      return 0;
                    };

                    // ── Stock ──
                    const getDisplayStock = (): number => {
                      if (product.stock !== undefined) {
                        const s = typeof product.stock === 'number'
                          ? product.stock
                          : parseInt(product.stock as string, 10);
                        if (!isNaN(s) && s >= 0) return s;
                      }
                      if (product.variants && product.variants.length > 0) {
                        for (const variant of product.variants) {
                          const s = typeof variant.stock === 'number'
                            ? variant.stock
                            : parseInt(variant.stock as string, 10);
                          if (!isNaN(s) && s >= 0) return s;
                        }
                      }
                      return 0;
                    };

                    const displayPrice = getDisplayPrice();
                    const displayStock = getDisplayStock();
                    const variantCount = product.variants?.length ?? 0;

                    // ── Image ──
                    const firstVariant =
                      product.hasVariants && product.variants?.length
                        ? product.variants[0]
                        : null;
                    const variantImgStr = firstVariant
                      ? (
                        (Array.isArray(firstVariant.variantImages) && typeof firstVariant.variantImages[0] === 'string'
                          ? (firstVariant.variantImages[0] as string)
                          : undefined) ||
                        (Array.isArray(firstVariant.images) && typeof firstVariant.images[0] === 'string'
                          ? (firstVariant.images[0] as string)
                          : undefined)
                      )
                      : undefined;
                    const displayImage: string =
                      product.productImages?.[0] || variantImgStr || "/assets/logo.webp";

                    // ── Status ──
                    const isActive = displayStock > 0;
                    const statusLabel = isActive ? "Active" : "Inactive";

                    // ── Discount ──
                    const discount = (product as any).discount ?? (product as any).discountPercent ?? null;

                    // ── Created date ──
                    const createdAt = (product as any).createdAt
                      ? new Date((product as any).createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—";

                    // ── Vendor ──
                    const vendorName =
                      (product as any).vendor?.name ||
                      (product as any).vendorName ||
                      "—";

                    return (
                      <tr
                        key={product.id}
                        className={`admin-products__table-row ${displayStock === 0 ? 'out-of-stock' : ''}`}
                      >
                        <td className="admin-products__image-cell">
                          <img
                            src={displayImage}
                            alt={product.name}
                            className="admin-products__product-image"
                          />
                        </td>
                        <td>{product.id}</td>
                        <td>{product.name}</td>
                        <td>{vendorName}</td>
                        <td>Rs. {(typeof displayPrice === 'number' ? displayPrice : Number(displayPrice)).toFixed(2)}</td>
                        <td>
                          <span className="admin-products__variant-badge">
                            {variantCount > 0 ? `${variantCount} variant${variantCount > 1 ? 's' : ''}` : '—'}
                          </span>
                        </td>
                        <td>
                          {discount != null && discount > 0
                            ? <span className="admin-products__discount-badge">{discount}%</span>
                            : '—'}
                        </td>
                        <td>
                          <span className={`admin-products__status-badge ${isActive ? 'status-active' : 'status-inactive'}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td>{createdAt}</td>
                        <td>
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
                      {filterOption !== "all"
                        ? `No products found with filter: ${filterOption}`
                        : "No products found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-products__pagination-container">
            <div className="admin-products__pagination-info">
              Page {currentPage} of {Math.max(1, Math.ceil(totalProducts / productsPerPage))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalProducts / productsPerPage)}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>

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
      />
    </div>
  );
};

export default AdminProduct;