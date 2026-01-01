'use client';

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProducts, deleteProduct } from "@/lib/api/products";
import { Product } from "@/components/Components/Types/EditProductTypes";
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/context/AuthContext';
import AdminEditProductModal from '@/components/Components/Modal/AdminEditProductModal';
import '@/styles/AdminProduct.css';

const AdminProductList: React.FC = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [vendorId] = useState(1);
  const productsPerPage = 10;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-products', vendorId, currentPage, searchQuery],
    queryFn: () => fetchProducts(vendorId, currentPage, productsPerPage),
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const numericId = Number(productId);
      return deleteProduct(numericId, token || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete product');
      console.error('Delete error:', error);
    },
  });

  const handleEdit = useCallback((product: Product) => {
    const productForEdit: Product = {
      ...product,
      id: String(product.id),
      name: String(product.name || product['title'] || ''),
      description: String(product.description || ''),
      categoryId: Number(product.categoryId) || 0,
      subcategoryId: Number(product.subcategoryId) || 0,
      hasVariants: Boolean(product.hasVariants || product.variants && product.variants.length > 0),
      basePrice: typeof product.basePrice === 'number' ? product.basePrice :
        typeof product['price'] === 'number' ? product['price'] :
          typeof product['price'] === 'string' ? parseFloat(product['price']) : 0,
      stock: Number(product.stock) || 0,
      status: (product.status as 'AVAILABLE' | 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK' | 'DISCONTINUED' | 'UNAVAILABLE') || 'AVAILABLE',
      images: Array.isArray(product.images) ? product.images :
        Array.isArray(product['productImages']) ? product['productImages'] :
          product['image'] ? [product['image']] : [],
      variants: (Array.isArray(product.variants) ? product.variants : []).map(variant => ({
        sku: String(variant.sku || ''),
        price: Number(variant.price) || 0,
        stock: Number(variant.stock) || 0,
        status: (variant.status as 'AVAILABLE' | 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK' | 'DISCONTINUED' | 'UNAVAILABLE') || 'AVAILABLE',
        attributes: Array.isArray(variant.attributes) ? variant.attributes : [],
        images: Array.isArray(variant.images) ? variant.images : []
      }))
    };

    setEditingProduct(productForEdit);
    setIsEditModalOpen(true);
    setIsModalClosing(false);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsModalClosing(true);
    setTimeout(() => {
      setIsEditModalOpen(false);
      setEditingProduct(null);
      setIsModalClosing(false);
    }, 300);
  }, []);

  const handleProductUpdate = useCallback((success: boolean) => {
    if (success) {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product updated successfully');
      handleCloseEditModal();
    }
  }, [queryClient, handleCloseEditModal]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  if (isLoading) return <div>Loading products...</div>;
  if (isError) return <div>Error loading products</div>;

  return (
    <div className="admin-product-container">
      <h1 className="admin-product-title">Product Management</h1>

      <div className="mb-6 flex justify-between items-center">
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search products..."
            className="admin-product-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-product-table-container">
        <table className="admin-product-table">
          <thead className="admin-product-table-head">
            <tr>
              <th className="admin-product-table-header">
                Image
              </th>
              <th className="admin-product-table-header">
                Name
              </th>
              <th className="admin-product-table-header">
                Vendor
              </th>
              <th className="admin-product-table-header">
                Price
              </th>
              <th className="admin-product-table-header">
                Stock
              </th>
              <th className="admin-product-table-header">
                Status
              </th>
              <th className="admin-product-table-header" style={{ textAlign: 'right' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="admin-product-table-body">
            {data?.data?.products?.map((product: Product) => (
              <tr key={product.id} className="admin-product-table-row">
                <td className="admin-product-table-cell">
                  <div className="admin-product-image-container">
                    <img
                      src={product['image'] || '/placeholder-product.jpg'}
                      alt={product.name}
                      className="admin-product-image"
                    />
                  </div>
                </td>
                <td className="admin-product-table-cell">
                  <div className="admin-product-text-primary">{product.name}</div>
                  <div className="admin-product-text-secondary">{product['category']}</div>
                </td>
                <td className="admin-product-table-cell admin-product-text-secondary">
                  {product['vendor'] || 'N/A'}
                </td>
                <td className="admin-product-table-cell">
                  <div className="admin-product-text-primary">
                    ${typeof product['price'] === 'string' ? parseFloat(product['price']).toFixed(2) : (Number(product['price']) || 0).toFixed(2)}
                    {product['originalPrice'] && (
                      <span className="admin-product-text-secondary" style={{ marginLeft: '0.5rem', textDecoration: 'line-through' }}>
                        ${typeof product['originalPrice'] === 'string' ? parseFloat(product['originalPrice']).toFixed(2) : (Number(product['originalPrice']) || 0).toFixed(2)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="admin-product-table-cell admin-product-text-secondary">
                  {product.stock}
                </td>
                <td className="admin-product-table-cell">
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    display: 'inline-flex',
                    fontSize: '0.75rem',
                    lineHeight: '1.25rem',
                    fontWeight: 600,
                    borderRadius: '9999px',
                    backgroundColor: product.status === 'OUT_OF_STOCK' ? '#fee2e2' : '#d1fae5',
                    color: product.status === 'OUT_OF_STOCK' ? '#991b1b' : '#065f46'
                  }}>
                    {product.status === 'OUT_OF_STOCK'
                      ? 'Out of Stock'
                      : product.status === 'LOW_STOCK'
                        ? 'Low Stock'
                        : 'In Stock'}
                  </span>
                </td>
                <td className="admin-product-table-cell" style={{ textAlign: 'right', fontSize: '0.875rem', fontWeight: 500 }}>
                  <button
                    onClick={() => handleEdit(product)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      cursor: 'pointer',
                      marginRight: '1rem'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#1e3a8a'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#2563eb'}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(product.id.toString())}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#7f1d1d'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#dc2626'}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.875rem', color: '#374151' }}>
          Showing <span style={{ fontWeight: 500 }}>{(currentPage - 1) * productsPerPage + 1}</span> to{' '}
          <span style={{ fontWeight: 500 }}>
            {Math.min(currentPage * productsPerPage, data?.data?.total || 0)}
          </span>{' '}
          of <span style={{ fontWeight: 500 }}>{data?.data?.total || 0}</span> products
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '0.25rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.25rem',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1
            }}
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={!data?.data?.hasMore}
            style={{
              padding: '0.25rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.25rem',
              cursor: !data?.data?.hasMore ? 'not-allowed' : 'pointer',
              opacity: !data?.data?.hasMore ? 0.5 : 1
            }}
          >
            Next
          </button>
        </div>
      </div>

      {isEditModalOpen && editingProduct && (
        <AdminEditProductModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSubmit={handleProductUpdate}
          product={editingProduct as any}
        />
      )}
    </div>
  );
};

export default AdminProductList;
