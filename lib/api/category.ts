import axiosInstance from "./axiosInstance";

export const fetchCategory = async () => {
	try {
		//"🌐 Fetching categories from /api/categories...");
		const response = await axiosInstance.get("/api/categories");
		//"📦 Raw API response:", response.data);

		// Handle the response structure based on API documentation
		if (response.data && response.data.success && response.data.data) {
			return response.data.data;
		} else {
			console.warn("⚠️ Unexpected response structure:", response.data);
			return response.data.data || response.data || [];
		}
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		console.error("❌ Failed to fetch categories:", errorMessage);
		throw new Error(`Failed to fetch categories: ${errorMessage}`);
	}
};

