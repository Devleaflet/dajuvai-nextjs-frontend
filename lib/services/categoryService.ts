import axios from 'axios';
import { API_BASE_URL } from '@/lib/config';

export interface Category {
  id: number;
  name: string;
  image?: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: number;
  name: string;
  image?: string;
  categoryId: number;
}

class CategoryService {
  private static instance: CategoryService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = `${API_BASE_URL}/api/categories`;
  }

  public static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService();
    }
    return CategoryService.instance;
  }

  async getAllCategories(token?: string): Promise<Category[]> {
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(this.baseUrl, config);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  async getSubcategories(categoryId: number, token?: string): Promise<Subcategory[]> {
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(`${this.baseUrl}/${categoryId}/subcategories`, config);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      return [];
    }
  }
}

export default CategoryService; 