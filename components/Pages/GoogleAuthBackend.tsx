'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/lib/context/AuthContext";
import { processGoogleAuthResponse } from "@/lib/utils/googleAuthUtils";
import { API_BASE_URL } from "@/lib/config";
import axios from 'axios';
import '@/styles/GoogleAuthCallback.css';

const GoogleAuthBackend: React.FC = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const processBackendCallback = async () => {
      try {
        // Get the authorization code from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          setError(`Google authentication failed: ${error}`);
          setIsProcessing(false);
          return;
        }

        if (!code) {
          setError('No authorization code received from Google');
          setIsProcessing(false);
          return;
        }

        // Make a request to the backend callback URL to get the response
        const response = await axios.get(`${API_BASE_URL}/api/auth/google/callback?${window.location.search}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Process the response data
        const result = await processGoogleAuthResponse(response.data, login, (path: string) => router.push(path));

        if (!result.success) {
          setError(result.error || 'Authentication failed');
        }
      } catch (err) {
        console.error('Google OAuth backend callback error:', err);
        if (axios.isAxiosError(err)) {
          const errorMessage = err.response?.data?.message ||
            err.response?.data?.error ||
            'Authentication failed';
          setError(errorMessage);
        } else {
          setError('An unexpected error occurred during authentication');
        }
      } finally {
        setIsProcessing(false);
      }
    };

    processBackendCallback();
  }, [login, router]);

  if (isProcessing) {
    return (
      <div className="google-auth-callback">
        <div className="google-auth-callback__container">
          <div className="google-auth-callback__loading">
            <div className="google-auth-callback__spinner"></div>
            <p className="google-auth-callback__message">Processing Google authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="google-auth-callback">
        <div className="google-auth-callback__container">
          <div className="google-auth-callback__error">
            <div className="google-auth-callback__error-icon">⚠️</div>
            <h2 className="google-auth-callback__title">Authentication Failed</h2>
            <p className="google-auth-callback__message">{error}</p>
            <button
              onClick={() => router.replace('/')}
              className="google-auth-callback__button"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default GoogleAuthBackend; 
