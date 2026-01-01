'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, MapPin, Phone, Building, CheckCircle, XCircle } from 'lucide-react';
import { API_BASE_URL } from "@/lib/config";
import '@/styles/VendorAuth.css';

interface VendorData {
  id: number;
  email: string;
  businessName: string;
}

interface AuthResponse {
  success: boolean;
  vendor?: VendorData;
  token?: string;
  message?: string;
  errors?: Array<{
    path: string[];
    message: string;
  }>;
}

const VendorAuth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    businessName: '',
    businessAddress: '',
    phoneNumber: ''
  });

  // Messages and errors
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  // Auto-hide messages after 5 seconds
  useEffect(() => {
    if (showMessage) {
      const timer = setTimeout(() => {
        setShowMessage(false);
        setMessage('');
        setErrors([]);
        setIsSuccess(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showMessage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (errors.length > 0 || message) {
      setErrors([]);
      setMessage('');
      setIsSuccess(false);
      setShowMessage(false);
    }
  };

  const handleSendVerification = async () => {
    if (!verificationEmail) {
      setMessage('Please enter your email address');
      setShowMessage(true);
      return;
    }

    setIsLoading(true);
    setMessage('');
    setErrors([]);
    setShowMessage(false);

    try {
      const response = await fetch(`${API_BASE_URL}/api/vendors/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: verificationEmail }),
      });

      const data: AuthResponse = await response.json();

      setShowMessage(true);
      if (data.success) {
        setMessage('Verification email sent! Please check your inbox.');
        setIsSuccess(true);
      } else {
        setErrors(data.errors?.map(err => err.message) || ['Failed to send verification email']);
      }
    } catch (error) {
      setMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      businessName: '',
      businessAddress: '',
      phoneNumber: ''
    });
    setErrors([]);
    setMessage('');
    setIsSuccess(false);
    setShowMessage(false);
  };

  if (showVerification) {
    return (
      <div className="vendor-auth-container">
        <div className="vendor-auth-card">
          <div className="vendor-auth-heading">
            <h2 className="vendor-auth-title">Email Verification</h2>
            <p className="vendor-auth-subtitle">Enter your email to receive a verification token</p>
          </div>

          <div className="vendor-auth-form">
            <div className="vendor-auth-input-wrapper">
              <Mail className="vendor-auth-input-icon" size={20} />
              <input
                type="email"
                placeholder="Enter your email"
                value={verificationEmail}
                onChange={(e) => setVerificationEmail(e.target.value)}
                className="vendor-auth-input"
              />
            </div>

            <button
              onClick={handleSendVerification}
              disabled={isLoading}
              className="vendor-auth-button"
            >
              {isLoading ? 'Sending...' : 'Send Verification Token'}
            </button>

            {showMessage && message && (
              <div className={isSuccess ? 'vendor-auth-success' : 'vendor-auth-message'}>
                {isSuccess ? (
                  <CheckCircle size={20} />
                ) : (
                  <XCircle size={20} />
                )}
                {message}
              </div>
            )}

            <button
              onClick={() => setShowVerification(false)}
              className="vendor-auth-back-button"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vendor-auth-container">
      <div className="vendor-auth-card">
        <div className="vendor-auth-heading">
          <h2 className="vendor-auth-title">
            {isLogin ? 'Vendor Login' : 'Vendor Registration'}
          </h2>
          <p className="vendor-auth-subtitle">
            {isLogin ? 'Sign in to your vendor account' : 'Create your vendor account'}
          </p>
        </div>

        <div className="vendor-auth-form">
          {!isLogin && (
            <>
              <div className="vendor-auth-input-wrapper">
                <Building className="vendor-auth-input-icon" size={20} />
                <input
                  type="text"
                  name="businessName"
                  placeholder="Business Name"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  required
                  className="vendor-auth-input"
                />
              </div>

              <div className="vendor-auth-input-wrapper">
                <MapPin className="vendor-auth-textarea-icon" size={20} />
                <textarea
                  name="businessAddress"
                  placeholder="Business Address"
                  value={formData.businessAddress}
                  onChange={handleInputChange}
                  required
                  className="vendor-auth-textarea"
                  rows={3}
                />
              </div>

              <div className="vendor-auth-input-wrapper">
                <Phone className="vendor-auth-input-icon" size={20} />
                <input
                  type="tel"
                  name="phoneNumber"
                  placeholder="Phone Number"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                  className="vendor-auth-input"
                />
              </div>
            </>
          )}

          <div className="vendor-auth-input-wrapper">
            <Mail className="vendor-auth-input-icon" size={20} />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="vendor-auth-input"
            />
          </div>

          <div className="vendor-auth-password-wrapper">
            <Lock className="vendor-auth-input-icon" size={20} />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="vendor-auth-password-input"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="vendor-auth-password-toggle"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="vendor-auth-button"
          >
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register')}
          </button>

          {showMessage && errors.length > 0 && (
            <div className="vendor-auth-error">
              <div className="vendor-auth-error-header">
                <XCircle size={20} />
                <span>Please fix the following errors:</span>
              </div>
              {errors.map((error, index) => (
                <div key={index} className="vendor-auth-error-text">
                  • {error}
                </div>
              ))}
            </div>
          )}

          {showMessage && message && (
            <div className={isSuccess ? 'vendor-auth-success' : 'vendor-auth-message'}>
              {isSuccess ? (
                <CheckCircle size={20} />
              ) : (
                <XCircle size={20} />
              )}
              {message}
            </div>
          )}

          <div className="vendor-auth-footer">
            <p className="vendor-auth-footer-text">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={toggleMode}
                className="vendor-auth-footer-link"
              >
                {isLogin ? 'Register here' : 'Login here'}
              </button>
            </p>

            {isLogin && (
              <button
                type="button"
                onClick={() => setShowVerification(true)}
                className="vendor-auth-footer-link"
              >
                Need email verification?
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorAuth;
