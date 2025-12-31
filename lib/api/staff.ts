// staff.ts - API service for staff-related operations

import axiosInstance from './axiosInstance';

// Helper function to safely get error message
const getErrorMessage = (error: unknown): string => {
	if (error instanceof Error) return error.message;
	if (typeof error === 'object' && error !== null && 'message' in error) {
		return String((error as any).message);
	}
	return String(error);
};

// Helper to check if error is an axios error
const isAxiosError = (error: unknown): error is { 
	name?: string;
	message?: string;
	response?: { status?: number; statusText?: string; headers?: any; data?: any; config?: any };
	config?: { url?: string; method?: string; data?: any };
} => {
	return typeof error === 'object' && error !== null && ('response' in error || 'config' in error);
};

// Types
export interface StaffUser {
  id: number;
  username: string;
  email: string;
  role?: string;
  createdAt?: string;
}

export interface StaffRegistrationData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Generic API response matching our backend style
export type FieldErrorObject = Record<string, string[] | string>;
export type FieldErrorArray = Array<{ message: string; field?: string }>;

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: FieldErrorArray | FieldErrorObject;
  statusCode?: number;
}

const staffApi = {
  // Register a new staff user
  async registerStaff(staffData: StaffRegistrationData): Promise<ApiResponse<{ user: StaffUser }>> {
    try {
      // Ensure all fields are properly formatted
      const requestData = {
        username: staffData.username.trim(),
        email: staffData.email.trim().toLowerCase(),
        password: staffData.password,
        confirmPassword: staffData.confirmPassword
      };
      
      const response = await axiosInstance.post('/api/auth/signup/staff', requestData, {
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        validateStatus: (status) => status < 500 // do not throw for < 500
      });
      
      //'API Response:', response.data);
      
      // Successful response (201 Created)
      if (response.status === 201) {
        return {
          success: true,
          data: { user: response.data.user }
        };
      }

      // Error responses (400, 409, etc.)
      return {
        success: false,
        ...(typeof response.data === 'object' ? response.data : { message: String(response.data) }),
        statusCode: response.status
      };
      
    } catch (error: unknown) {
      console.error('Unexpected error in registerStaff:', isAxiosError(error) ? {
        name: error.name,
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        } : 'No response',
        config: error.config ? {
          url: error.config.url,
          method: error.config.method,
          data: error.config.data
        } : 'No config'
      } : error);
      
      const errorMessage = isAxiosError(error) && error.response?.data?.message 
        ? error.response.data.message 
        : getErrorMessage(error);
      
      return {
        success: false,
        message: errorMessage || 'Network error',
        statusCode: isAxiosError(error) ? error.response?.status || 0 : 0
      };
    }
  },
  
  // Get all staff users
  async getStaffList(): Promise<ApiResponse<StaffUser[]>> {
    try {
      //'Fetching staff list...');
      const response = await axiosInstance.get('/api/auth/staff');
      //'Staff list response:', response.data);
      // API documentation shows { success: true, data: StaffUser[] }
      return response.data;
    } catch (error: unknown) {
      console.error('Error fetching staff list:', isAxiosError(error) ? {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        config: error.config
      } : error);
      
      // Return empty array if endpoint doesn't exist yet or returns 404
      if (isAxiosError(error) && error.response?.status === 404) {
        //'Staff endpoint not found, returning empty list');
        return { success: true, data: [] };
      }
      
      // Return error response if available
      if (isAxiosError(error) && error.response?.data) {
        return {
          success: false,
          ...error.response.data,
          statusCode: error.response.status
        };
      }
      
      // Return generic error
      return {
        success: false,
        message: getErrorMessage(error) || 'Failed to fetch staff list'
      };
    }
  },

  // Delete a staff user
  async deleteStaff(id: number): Promise<ApiResponse<void>> {
    try {
      await axiosInstance.delete(`/api/auth/staff/${id}`);
      return { success: true };
    } catch (error: unknown) {
      console.error('Error deleting staff:', error);
      const errorMessage = isAxiosError(error) && error.response?.data?.message 
        ? error.response.data.message 
        : 'Failed to delete staff member';
      const statusCode = isAxiosError(error) && error.response?.status 
        ? error.response.status 
        : undefined;
      return {
        success: false,
        message: errorMessage,
        ...(statusCode !== undefined && { statusCode })
      };
    }
  }
};

export default staffApi;

