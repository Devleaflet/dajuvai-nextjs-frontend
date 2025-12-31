'use client';

import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, ProductFormData } from '@/lib/validations/product.schema';

interface ValidatedProductFormProps {
  onSubmit: (data: ProductFormData) => void;
  initialData?: Partial<ProductFormData>;
  isLoading?: boolean;
}

/**
 * Validated Product Form Component
 * Uses React Hook Form with Zod validation for product creation/editing
 * 
 * @example
 * ```tsx
 * <ValidatedProductForm
 *   onSubmit={(data) => console.log(data)}
 *   initialData={{ name: 'Test Product' }}
 * />
 * ```
 */
export const ValidatedProductForm: React.FC<ValidatedProductFormProps> = ({
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    ...(initialData && { defaultValues: initialData }),
  });

  const hasDiscount = watch('discount');

  const onSubmitHandler: SubmitHandler<ProductFormData> = (data) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4">
      {/* Product Name */}
      <div className="form-group">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Product Name *
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          className={`mt-1 block w-full rounded-md border ${errors.name ? 'border-red-500' : 'border-gray-300'
            } px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500`}
          placeholder="Enter product name"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="form-group">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description *
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={4}
          className={`mt-1 block w-full rounded-md border ${errors.description ? 'border-red-500' : 'border-gray-300'
            } px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500`}
          placeholder="Enter product description"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Base Price */}
      <div className="form-group">
        <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700">
          Base Price (Rs) *
        </label>
        <input
          id="basePrice"
          type="number"
          step="0.01"
          {...register('basePrice', { valueAsNumber: true })}
          className={`mt-1 block w-full rounded-md border ${errors.basePrice ? 'border-red-500' : 'border-gray-300'
            } px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500`}
          placeholder="0.00"
        />
        {errors.basePrice && (
          <p className="mt-1 text-sm text-red-600">{errors.basePrice.message}</p>
        )}
      </div>

      {/* Stock */}
      <div className="form-group">
        <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
          Stock Quantity *
        </label>
        <input
          id="stock"
          type="number"
          {...register('stock', { valueAsNumber: true })}
          className={`mt-1 block w-full rounded-md border ${errors.stock ? 'border-red-500' : 'border-gray-300'
            } px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500`}
          placeholder="0"
        />
        {errors.stock && (
          <p className="mt-1 text-sm text-red-600">{errors.stock.message}</p>
        )}
      </div>

      {/* Discount */}
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label htmlFor="discount" className="block text-sm font-medium text-gray-700">
            Discount (Optional)
          </label>
          <input
            id="discount"
            type="number"
            step="0.01"
            {...register('discount', { valueAsNumber: true })}
            className={`mt-1 block w-full rounded-md border ${errors.discount ? 'border-red-500' : 'border-gray-300'
              } px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500`}
            placeholder="0"
          />
          {errors.discount && (
            <p className="mt-1 text-sm text-red-600">{errors.discount.message}</p>
          )}
        </div>

        {/* Discount Type */}
        {hasDiscount && (
          <div className="form-group">
            <label htmlFor="discountType" className="block text-sm font-medium text-gray-700">
              Discount Type
            </label>
            <select
              id="discountType"
              {...register('discountType')}
              className={`mt-1 block w-full rounded-md border ${errors.discountType ? 'border-red-500' : 'border-gray-300'
                } px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500`}
            >
              <option value="">Select type</option>
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED">Fixed Amount</option>
            </select>
            {errors.discountType && (
              <p className="mt-1 text-sm text-red-600">{errors.discountType.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Category */}
      <div className="form-group">
        <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
          Category *
        </label>
        <select
          id="categoryId"
          {...register('categoryId', { valueAsNumber: true })}
          className={`mt-1 block w-full rounded-md border ${errors.categoryId ? 'border-red-500' : 'border-gray-300'
            } px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500`}
        >
          <option value="">Select category</option>
          {/* Categories would be loaded dynamically */}
        </select>
        {errors.categoryId && (
          <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
        )}
      </div>

      {/* Subcategory */}
      <div className="form-group">
        <label htmlFor="subcategoryId" className="block text-sm font-medium text-gray-700">
          Subcategory *
        </label>
        <select
          id="subcategoryId"
          {...register('subcategoryId', { valueAsNumber: true })}
          className={`mt-1 block w-full rounded-md border ${errors.subcategoryId ? 'border-red-500' : 'border-gray-300'
            } px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500`}
        >
          <option value="">Select subcategory</option>
          {/* Subcategories would be loaded dynamically */}
        </select>
        {errors.subcategoryId && (
          <p className="mt-1 text-sm text-red-600">{errors.subcategoryId.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className={`px-6 py-2 rounded-md text-white font-medium ${isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2'
            }`}
        >
          {isLoading ? 'Saving...' : 'Save Product'}
        </button>
      </div>
    </form>
  );
};

export default ValidatedProductForm;
