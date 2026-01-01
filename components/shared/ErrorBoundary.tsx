'use client';

/**
 * ErrorBoundary component for catching and handling React errors
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * 
 * // With custom fallback
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */

import React, { Component, ReactNode } from 'react';
import logger from '@/lib/utils/logger';
import '@/styles/ErrorBoundary.css';

/**
 * Props for the ErrorBoundary component
 */
interface Props {
  /**
   * Child components to be wrapped by the error boundary
   */
  children: ReactNode;

  /**
   * Optional custom fallback UI to display when an error occurs
   * If not provided, a default error UI will be shown
   */
  fallback?: ReactNode;
}

/**
 * State for the ErrorBoundary component
 */
interface State {
  /**
   * Whether an error has been caught
   */
  hasError: boolean;

  /**
   * The error that was caught, if any
   */
  error?: Error | undefined;
}

/**
 * ErrorBoundary component that catches JavaScript errors in child components
 * Displays a fallback UI and logs errors for debugging
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
    };
  }

  /**
   * Static method called when an error is thrown in a child component
   * Updates state to trigger fallback UI rendering
   * 
   * @param error - The error that was thrown
   * @returns New state object
   */
  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Lifecycle method called after an error is caught
   * Logs the error for debugging and monitoring
   * 
   * @param error - The error that was thrown
   * @param errorInfo - Additional information about the error
   */
  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error details for debugging
    logger.error('ErrorBoundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // In production, you might want to send this to an error monitoring service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  /**
   * Resets the error boundary state
   * Allows users to try again after an error
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: undefined,
    });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      // If custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: '0 1rem' }}>
          <div style={{ maxWidth: '28rem', width: '100%', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', padding: '2rem', textAlign: 'center' }}>
            <div style={{ marginBottom: '1rem' }}>
              <svg
                style={{ margin: '0 auto', height: '4rem', width: '4rem', color: '#ef4444' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1 className="error-boundary-title">
              Oops! Something went wrong
            </h1>

            <p className="error-boundary-description">
              We encountered an unexpected error. Please try again or contact support if the problem persists.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="error-boundary-error-container">
                <p className="error-boundary-error-title">
                  Error Details (Development Only):
                </p>
                <p className="error-boundary-error-message">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="error-boundary-button-primary"
            >
              Try Again
            </button>

            <button
              onClick={() => window.location.href = '/'}
              className="error-boundary-button-secondary"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
