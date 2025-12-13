// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

// Frontend URL
export const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

// Google OAuth Configuration
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'your-google-client-id-here';
export const GOOGLE_REDIRECT_URI = typeof window !== 'undefined' 
  ? `${window.location.origin}/auth/google/callback` 
  : `${FRONTEND_URL}/auth/google/callback`;
