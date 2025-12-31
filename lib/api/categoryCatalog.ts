import axios from "axios";
import { API_BASE_URL } from "@/lib/config";

export const fetchCategoryCatalog = async () => {
	try {
		//"🌐 Fetching categories from /api/home/category/section...");
		const response = await axios.get(`${API_BASE_URL}/api/home/category/section`);
		//"📦 Raw API response:", response.data);

		// Handle the response structure based on API documentation
		if (response.data && response.data.success && response.data.data) {
			
			return response.data.data;
		} else {
			console.warn("⚠️ Unexpected response structure:", response.data);
			return response.data.data || response.data || [];
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		console.error("❌ Failed to fetch categories:", errorMessage);
		throw new Error(`Failed to fetch categories: ${errorMessage}`);
	}
};
