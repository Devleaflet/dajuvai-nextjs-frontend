'use client';

import type React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuth } from "@/lib/context/AuthContext";
import { API_BASE_URL } from "@/lib/config";
import Pagination from "@/components/Components/Pagination";
import DeleteModal from "@/components/Components/Modal/DeleteModal";
import CategoryEditModal from "@/components/Components/Modal/CategoryEditModal";
import SubCategoryModal from "@/components/Components/Modal/SubCategoryModal";
import SubcategoriesViewModal from "@/components/Components/Modal/SubcategoriesViewModal";
import "@/styles/AdminCategories.css";
import { Plus } from "lucide-react";

interface SubCategory {
  id: string;
  name: string;
  image?: string;
}

interface Category {
  id: string;
  name: string;
  status: "Visible" | "Hidden";
  date: string;
  image?: string;
  subCategories: SubCategory[];
}

interface ApiErrorResponse {
  message?: string;
}

const mockCategories: Category[] = [
  {
    id: "1",
    name: "Electronics",
    status: "Visible",
    date: "04/10/2014",
    image: "/assets/electronics.jpg",
    subCategories: [
      { id: "1-1", name: "Smartphones", image: "/assets/smartphones.jpg" },
      { id: "1-2", name: "Laptops", image: "/assets/laptops.jpg" },
    ],
  },
  {
    id: "2",
    name: "Fashion",
    status: "Visible",
    date: "04/10/2014",
    image: "/assets/fashion.jpg",
    subCategories: [
      { id: "2-1", name: "Men's Clothing", image: "/assets/mens.jpg" },
      { id: "2-2", name: "Women's Clothing", image: "/assets/womens.jpg" },
    ],
  },
  {
    id: "3",
    name: "Home and Furniture",
    status: "Visible",
    date: "04/10/2014",
    image: "/assets/furniture.jpg",
    subCategories: [
      { id: "3-1", name: "Living Room", image: "/assets/living-room.jpg" },
      { id: "3-2", name: "Bedroom", image: "/assets/bedroom.jpg" },
    ],
  },
  {
    id: "4",
    name: "Health and Nutritions",
    status: "Visible",
    date: "04/10/2014",
    image: "/assets/health.jpg",
    subCategories: [
      { id: "4-1", name: "Vitamins", image: "/assets/vitamins.jpg" },
      { id: "4-2", name: "Protein", image: "/assets/protein.jpg" },
    ],
  },
  {
    id: "5",
    name: "Automobiles",
    status: "Visible",
    date: "04/10/2014",
    image: "/assets/automobiles.jpg",
    subCategories: [
      { id: "5-1", name: "Cars", image: "/assets/cars.jpg" },
      { id: "5-2", name: "Motorcycles", image: "/assets/motorcycles.jpg" },
    ],
  },
  {
    id: "6",
    name: "Beauty and Fragrance",
    status: "Visible",
    date: "04/10/2014",
    image: "/assets/beauty.jpg",
    subCategories: [
      { id: "6-1", name: "Skincare", image: "/assets/skincare.jpg" },
      { id: "6-2", name: "Perfumes", image: "/assets/perfumes.jpg" },
    ],
  },
];

const CACHE_KEY = "admin_categories";
const CACHE_TTL = 10 * 60 * 1000;

const CategorySkeleton: React.FC = () => (
  <>
    {Array.from({ length: 7 }).map((_, index) => (
      <tr key={index} className="admin-categories__table-row admin-categories__skeleton-row">
        <td className="admin-categories__name-cell">
          <div className="admin-categories__category-container">
            <div className="admin-categories__skeleton admin-categories__skeleton-image" />
            <div className="admin-categories__skeleton admin-categories__skeleton-text admin-categories__skeleton-text--name" />
          </div>
        </td>
        <td><div className="admin-categories__skeleton admin-categories__skeleton-text admin-categories__skeleton-text--status" /></td>
        <td><div className="admin-categories__skeleton admin-categories__skeleton-text admin-categories__skeleton-text--date" /></td>
        <td className="admin-categories__actions">
          <div className="admin-categories__skeleton admin-categories__skeleton-button" />
          <div className="admin-categories__skeleton admin-categories__skeleton-button" />
          <div className="admin-categories__skeleton admin-categories__skeleton-button" />
          <div className="admin-categories__skeleton admin-categories__skeleton-button" />
        </td>
      </tr>
    ))}
  </>
);

const AdminCategories: React.FC = () => {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [categoriesPerPage] = useState(7);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);
  const [showCategoryEditModal, setShowCategoryEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [showSubcategoriesViewModal, setShowSubcategoriesViewModal] = useState(false);
  const [showHomepageModal, setShowHomepageModal] = useState(false);
  const [homepageCategories, setHomepageCategories] = useState<string[]>([]);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [subCategoryToDelete, setSubCategoryToDelete] = useState<{ categoryId: string; subCategoryId: string } | null>(null);
  const [isAddingSubCategory, setIsAddingSubCategory] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubCategoryLoading, setIsSubCategoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryImageChanging, setCategoryImageChanging] = useState<string | null>(null);
  const [subcategoryImageChanging, setSubcategoryImageChanging] = useState<string | null>(null);
  const [newCategoryImage, setNewCategoryImage] = useState<File | null>(null);
  const [newSubcategoryImage, setNewSubcategoryImage] = useState<File | null>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState<string | null>(null);
  const [subcategoryImagePreview, setSubcategoryImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      setError(null);
      try {
        localStorage.removeItem(CACHE_KEY);
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const { data, timestamp } = JSON.parse(cached);
            if (Array.isArray(data) && Date.now() - timestamp < CACHE_TTL) {
              setCategories(data);
              setFilteredCategories(data);
              setIsLoading(false);
              return;
            }
          } catch { }
        }

        const response = await axios.get(`${API_BASE_URL}/api/categories`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        const formattedCategories: Category[] = await Promise.all(
          response.data.data.map(async (category: any) => {
            let subCategories: SubCategory[] = [];
            try {
              const subResponse = await axios.get(
                `${API_BASE_URL}/api/categories/${category.id}/subcategories`,
                { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
              );
              subCategories = subResponse.data.data.map((sub: any) => ({
                id: sub.id.toString(),
                name: sub.name,
                image: sub.image || undefined,
              }));
            } catch (subErr) {
              console.error(`Failed to fetch subcategories for category ${category.id}:`, subErr);
            }
            return {
              id: category.id.toString(),
              name: category.name,
              status: "Visible" as const,
              date: new Date(category.createdAt).toLocaleDateString(),
              image: category.image || undefined,
              subCategories,
            };
          })
        );
        setCategories(formattedCategories);
        setFilteredCategories(formattedCategories);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: formattedCategories, timestamp: Date.now() }));
      } catch (err) {
        console.error("Fetch categories error:", err);
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 404) {
            setError("Categories API endpoint not found. Using sample data.");
            setCategories(mockCategories);
            setFilteredCategories(mockCategories);
          } else if (err.response?.status === 401) {
            setError("Unauthorized. Please log in as an admin.");
          } else {
            setError((err.response?.data as ApiErrorResponse)?.message || "Failed to fetch categories");
            setCategories(mockCategories);
            setFilteredCategories(mockCategories);
          }
        } else {
          setError("An unexpected error occurred while fetching categories");
          setCategories(mockCategories);
          setFilteredCategories(mockCategories);
        }
      } finally {
        setIsLoading(false);
      }
    };

    const fetchHomepageCategories = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/home/category/section`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        if (response.data.success) {
          setHomepageCategories(response.data.data.map((item: any) => item.category.id.toString()));
        }
      } catch (err) {
        console.error("Fetch homepage categories error:", err);
      }
    };

    fetchCategories();
    fetchHomepageCategories();
  }, [token]);

  // Search filter
  useEffect(() => {
    const results = categories.filter(
      (category) =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCategories(results);
    setCurrentPage(1);
  }, [searchQuery, categories]);

  const handleHomepageCategoryChange = (categoryId: string) => {
    setHomepageCategories((prev) => {
      if (prev.includes(categoryId)) return prev.filter((id) => id !== categoryId);
      if (prev.length < 5) return [...prev, categoryId];
      setError("You can only select up to 5 categories");
      return prev;
    });
  };

  const handleSaveHomepageCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/home/category/section`,
        { categoryId: homepageCategories },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" } }
      );
      if (response.data.success) setShowHomepageModal(false);
      else setError(response.data.message || "Failed to update homepage categories");
    } catch (err) {
      console.error("Save homepage categories error:", err);
      if (axios.isAxiosError(err)) {
        setError((err.response?.data as ApiErrorResponse)?.message || "Failed to update homepage categories");
      } else {
        setError("An unexpected error occurred while saving homepage categories");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setIsAddingCategory(true);
    setShowCategoryEditModal(true);
  };

  const handleSaveCategory = async (updatedCategory: Category, imageFile?: File) => {
    setIsLoading(true);
    setError(null);
    try {
      if (isAddingCategory) {
        const formData = new FormData();
        formData.append("name", updatedCategory.name);
        if (imageFile) formData.append("image", imageFile);
        const response = await axios.post(`${API_BASE_URL}/api/categories`, formData, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
        const newCategory: Category = {
          id: response.data.data.id.toString(),
          name: response.data.data.name,
          status: "Visible",
          date: new Date().toLocaleDateString(),
          image: response.data.data.image || undefined,
          subCategories: [],
        };
        const updatedCategories = [...categories, newCategory];
        setCategories(updatedCategories);
        setFilteredCategories(updatedCategories);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: updatedCategories, timestamp: Date.now() }));
      } else if (updatedCategory.id) {
        const formData = new FormData();
        formData.append("name", updatedCategory.name);
        if (imageFile) formData.append("image", imageFile);
        const response = await axios.put(`${API_BASE_URL}/api/categories/${updatedCategory.id}`, formData, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
        const updatedCategoryFromApi: Category = {
          id: response.data.data.id.toString(),
          name: response.data.data.name,
          status: updatedCategory.status,
          date: updatedCategory.date,
          image: response.data.data.image || updatedCategory.image,
          subCategories: response.data.data.subcategories?.map((sub: any) => ({
            id: sub.id.toString(), name: sub.name, image: sub.image || undefined,
          })) || updatedCategory.subCategories,
        };
        const updatedCategories = categories.map((c) => c.id === updatedCategory.id ? updatedCategoryFromApi : c);
        setCategories(updatedCategories);
        setFilteredCategories(updatedCategories);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: updatedCategories, timestamp: Date.now() }));
      }
    } catch (err) {
      console.error("Save category error:", err);
      if (axios.isAxiosError(err)) {
        setError((err.response?.data as ApiErrorResponse)?.message || "Failed to save category");
      } else {
        setError("An unexpected error occurred while saving category");
      }
    } finally {
      setIsLoading(false);
      setShowCategoryEditModal(false);
      setIsAddingCategory(false);
    }
  };

  const handleAddSubCategory = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    if (category) {
      setSelectedCategory(category);
      setSelectedSubCategory(null);
      setIsAddingSubCategory(true);
      setShowSubCategoryModal(true);
    }
  };

  const handleSaveSubCategory = async (categoryId: string, subCategory: SubCategory, imageFile?: File) => {
    setIsSubCategoryLoading(true);
    setError(null);
    const loadingToast = toast.loading(isAddingSubCategory ? "Creating subcategory..." : "Updating subcategory...", { position: "top-right" });
    try {
      if (isAddingSubCategory) {
        const formData = new FormData();
        formData.append("name", subCategory.name);
        if (imageFile) formData.append("image", imageFile);
        const response = await axios.post(
          `${API_BASE_URL}/api/categories/${categoryId}/subcategories`, formData,
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
        );
        const newSubCategory: SubCategory = {
          id: response.data.data.id.toString(),
          name: response.data.data.name,
          image: response.data.data.image || undefined,
        };
        const updatedCategories = categories.map((c) =>
          c.id === categoryId ? { ...c, subCategories: [...c.subCategories, newSubCategory] } : c
        );
        setCategories(updatedCategories);
        setFilteredCategories(updatedCategories);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: updatedCategories, timestamp: Date.now() }));
        toast.dismiss(loadingToast);
        toast.success("Subcategory created successfully!", { position: "top-right", duration: 3000 });
      } else if (subCategory.id) {
        const formData = new FormData();
        formData.append("name", subCategory.name);
        if (imageFile) formData.append("image", imageFile);
        const response = await axios.put(
          `${API_BASE_URL}/api/categories/${categoryId}/subcategories/${subCategory.id}`, formData,
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
        );
        const updatedSubCategory: SubCategory = {
          id: response.data.data.id.toString(),
          name: response.data.data.name,
          image: response.data.data.image || subCategory.image,
        };
        const updatedCategories = categories.map((c) =>
          c.id === categoryId
            ? { ...c, subCategories: c.subCategories.map((s) => s.id === subCategory.id ? updatedSubCategory : s) }
            : c
        );
        setCategories(updatedCategories);
        setFilteredCategories(updatedCategories);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: updatedCategories, timestamp: Date.now() }));
        toast.dismiss(loadingToast);
        toast.success("Subcategory updated successfully!", { position: "top-right", duration: 3000 });
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      const msg = axios.isAxiosError(err)
        ? (err.response?.data as ApiErrorResponse)?.message || "Failed to save subcategory"
        : "An unexpected error occurred";
      setError(msg);
      toast.error(msg, { position: "top-right", duration: 4000 });
    } finally {
      setIsSubCategoryLoading(false);
      setShowSubCategoryModal(false);
      setIsAddingSubCategory(false);
    }
  };

  const editSubCategory = (categoryId: string, subCategoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    if (category) {
      const subCategory = category.subCategories.find((s) => s.id === subCategoryId);
      if (subCategory) {
        setSelectedCategory(category);
        setSelectedSubCategory(subCategory);
        setIsAddingSubCategory(false);
        setShowSubCategoryModal(true);
      }
    }
  };

  const handleChangeCategoryImage = (categoryId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleCategoryImageChange(categoryId, file);
    };
    input.click();
  };

  const handleCategoryImageChange = async (categoryId: string, file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image size should be less than 5MB"); return; }
    setCategoryImageChanging(categoryId);
    setCategoryImagePreview(URL.createObjectURL(file));
    const loadingToast = toast.loading("Updating category image...", { position: "top-right" });
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await axios.put(`${API_BASE_URL}/api/categories/${categoryId}`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      if (response.data.success) {
        const updatedCategories = categories.map((c) =>
          c.id === categoryId ? { ...c, image: response.data.data.image } : c
        );
        setCategories(updatedCategories);
        setFilteredCategories(updatedCategories);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: updatedCategories, timestamp: Date.now() }));
        toast.dismiss(loadingToast);
        toast.success("Category image updated successfully!", { position: "top-right", duration: 3000 });
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Failed to update category image", { position: "top-right", duration: 4000 });
    } finally {
      setCategoryImageChanging(null);
      setNewCategoryImage(null);
      setCategoryImagePreview(null);
    }
  };

  const handleChangeSubcategoryImage = (categoryId: string, subcategoryId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleSubcategoryImageChange(categoryId, subcategoryId, file);
    };
    input.click();
  };

  const handleSubcategoryImageChange = async (categoryId: string, subcategoryId: string, file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image size should be less than 5MB"); return; }
    setSubcategoryImageChanging(subcategoryId);
    setSubcategoryImagePreview(URL.createObjectURL(file));
    const loadingToast = toast.loading("Updating subcategory image...", { position: "top-right" });
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await axios.put(
        `${API_BASE_URL}/api/categories/${categoryId}/subcategories/${subcategoryId}`, formData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );
      if (response.data.success) {
        const updatedCategories = categories.map((c) =>
          c.id === categoryId
            ? { ...c, subCategories: c.subCategories.map((s) => s.id === subcategoryId ? { ...s, image: response.data.data.image } : s) }
            : c
        );
        setCategories(updatedCategories);
        setFilteredCategories(updatedCategories);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: updatedCategories, timestamp: Date.now() }));
        toast.dismiss(loadingToast);
        toast.success("Subcategory image updated successfully!", { position: "top-right", duration: 3000 });
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Failed to update subcategory image", { position: "top-right", duration: 4000 });
    } finally {
      setSubcategoryImageChanging(null);
      setNewSubcategoryImage(null);
      setSubcategoryImagePreview(null);
    }
  };

  const confirmDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setSubCategoryToDelete(null);
    setShowDeleteModal(true);
  };

  const confirmDeleteSubCategory = (categoryId: string, subCategoryId: string) => {
    setSubCategoryToDelete({ categoryId, subCategoryId });
    setCategoryToDelete(null);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (categoryToDelete) {
        await axios.delete(`${API_BASE_URL}/api/categories/${categoryToDelete.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const updatedCategories = categories.filter((c) => c.id !== categoryToDelete.id);
        setCategories(updatedCategories);
        setFilteredCategories(updatedCategories);
        setCategoryToDelete(null);
      } else if (subCategoryToDelete) {
        await axios.delete(
          `${API_BASE_URL}/api/categories/${subCategoryToDelete.categoryId}/subcategories/${subCategoryToDelete.subCategoryId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const updatedCategories = categories.map((c) =>
          c.id === subCategoryToDelete.categoryId
            ? { ...c, subCategories: c.subCategories.filter((s) => s.id !== subCategoryToDelete.subCategoryId) }
            : c
        );
        setCategories(updatedCategories);
        setFilteredCategories(updatedCategories);
        setSubCategoryToDelete(null);
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError(axios.isAxiosError(err) ? (err.response?.data as ApiErrorResponse)?.message || "Failed to delete" : "Unexpected error");
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
    }
  };

  const editCategory = (category: Category) => {
    setSelectedCategory({ ...category });
    setIsAddingCategory(false);
    setShowCategoryEditModal(true);
  };

  const indexOfLastCategory = currentPage * categoriesPerPage;
  const indexOfFirstCategory = indexOfLastCategory - categoriesPerPage;
  const currentCategories = filteredCategories.slice(indexOfFirstCategory, indexOfLastCategory);

  return (
    <div className="admin-categories">
      {/* ── Search bar (full width, outside card) ── */}
      <div className="admin-categories__search-bar-wrapper">
        <svg className="admin-categories__search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="8" stroke="#9CA3AF" strokeWidth="2" />
          <path d="M21 21L16.65 16.65" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          className="admin-categories__search-input"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="admin-categories__content">
        {error && (
          <div className="admin-categories__error">
            {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        <div className="admin-categories__list-container">
          {/* ── Card Header ── */}
          <div className="admin-categories__header">
            <h2>Category Management</h2>
            <div className="admin-categories__header-actions">
              <button className="admin-categories__btn-add-category" onClick={handleAddCategory}>
                <Plus size={16} />
                Add Category
              </button>
              <button className="admin-categories__btn-homepage" onClick={() => setShowHomepageModal(true)}>
                Manage Homepage Categories
              </button>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="admin-categories__table-container">
            <table className="admin-categories__table">
              <thead className="admin-categories__table-head">
                <tr>
                  <th>Category Name</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <CategorySkeleton />
                ) : currentCategories.length > 0 ? (
                  currentCategories.map((category) => (
                    <tr key={category.id} className="admin-categories__table-row">
                      {/* Category Name + image */}
                      <td className="admin-categories__name-cell">
                        <div className="admin-categories__category-container">
                          <div className="admin-categories__image-container">
                            <div className="admin-categories__category-image">
                              {(categoryImagePreview && categoryImageChanging === category.id) || category.image ? (
                                <img
                                  src={(categoryImagePreview && categoryImageChanging === category.id)
                                    ? categoryImagePreview
                                    : (category.image || "/placeholder.svg")}
                                  alt={category.name}
                                />
                              ) : (
                                <div className="admin-categories__no-image">No Image</div>
                              )}
                              <button
                                className="admin-categories__change-image-btn"
                                onClick={() => handleChangeCategoryImage(category.id)}
                                title="Change image"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                  <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 4H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <span className="admin-categories__category-name">{category.name}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`admin-categories__status admin-categories__status--${category.status.toLowerCase()}`}>
                          <span className="admin-categories__status-dot" />
                          {category.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="admin-categories__date-cell">{category.date}</td>

                      {/* Actions */}
                      <td>
                        <div className="admin-categories__actions">
                          {/* Delete */}
                          <button
                            className="admin-categories__action-btn admin-categories__delete-btn"
                            onClick={() => confirmDeleteCategory(category)}
                            aria-label="Delete category"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>

                          {/* View subcategories */}
                          <button
                            className="admin-categories__action-btn admin-categories__view-btn"
                            onClick={() => { setSelectedCategory(category); setShowSubcategoriesViewModal(true); }}
                            aria-label="View subcategories"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                            </svg>
                          </button>

                          {/* Edit */}
                          <button
                            className="admin-categories__action-btn admin-categories__edit-btn"
                            onClick={() => editCategory(category)}
                            aria-label="Edit category"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>

                          {/* Add subcategory */}
                          <button
                            className="admin-categories__action-btn admin-categories__add-sub-btn"
                            onClick={() => handleAddSubCategory(category.id)}
                            aria-label="Add subcategory"
                          >
                            ADD
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="admin-categories__no-data">
                      {searchQuery ? `No categories found for "${searchQuery}"` : "No categories found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          <div className="admin-categories__pagination-container">
            <div className="admin-categories__pagination-info">
              Showing {indexOfFirstCategory + 1}–{Math.min(indexOfLastCategory, filteredCategories.length)} out of {filteredCategories.length}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredCategories.length / categoriesPerPage)}
              onPageChange={(pageNumber) => setCurrentPage(pageNumber)}
            />
          </div>

          {/* ── Homepage Categories Modal ── */}
          {showHomepageModal && (
            <div className="admin-categories__modal-overlay">
              <div className="admin-categories__modal">
                <h2>Manage Homepage Categories</h2>
                <p>Select up to 5 categories to display on the homepage:</p>
                <div className="admin-categories__homepage-selection">
                  {categories.map((category) => (
                    <label key={category.id} className="admin-categories__checkbox-label">
                      <input
                        type="checkbox"
                        checked={homepageCategories.includes(category.id)}
                        onChange={() => handleHomepageCategoryChange(category.id)}
                        style={{ height: "fit-content" }}
                      />
                      {category.name}
                    </label>
                  ))}
                </div>
                <div className="admin-categories__modal-actions">
                  <button onClick={handleSaveHomepageCategories}>Save</button>
                  <button onClick={() => setShowHomepageModal(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <CategoryEditModal
        show={showCategoryEditModal}
        onClose={() => setShowCategoryEditModal(false)}
        onSave={handleSaveCategory}
        category={selectedCategory}
        isAdding={isAddingCategory}
      />
      <SubCategoryModal
        show={showSubCategoryModal}
        onClose={() => setShowSubCategoryModal(false)}
        onSave={(subCategory, imageFile) => {
          if (selectedCategory) handleSaveSubCategory(selectedCategory.id, subCategory, imageFile);
        }}
        subCategory={selectedSubCategory}
        categoryName={selectedCategory?.name || ""}
        isAdding={isAddingSubCategory}
        isLoading={isSubCategoryLoading}
      />
      <SubcategoriesViewModal
        show={showSubcategoriesViewModal}
        onClose={() => setShowSubcategoriesViewModal(false)}
        category={selectedCategory}
        onEditSubCategory={editSubCategory}
        onDeleteSubCategory={confirmDeleteSubCategory}
        onChangeSubcategoryImage={handleChangeSubcategoryImage}
        subcategoryImagePreview={subcategoryImagePreview}
        subcategoryImageChanging={subcategoryImageChanging}
      />
      <DeleteModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDelete}
        productName={
          categoryToDelete
            ? `Category: ${categoryToDelete.name}`
            : subCategoryToDelete
              ? `Subcategory from ${categories.find((c) => c.id === subCategoryToDelete.categoryId)?.name || ""}`
              : "Item"
        }
      />
    </div>
  );
};

export default AdminCategories;