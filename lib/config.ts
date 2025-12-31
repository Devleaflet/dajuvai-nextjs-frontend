/**
 * Environment variable validation and configuration
 * 
 * This module validates environment variables at application startup
 * to ensure all required configuration is present and valid.
 */

import { z } from 'zod';
import logger from './utils/logger';

/**
 * Environment variable schema definition
 * Validates all required environment variables with appropriate types
 */
const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url({
    message: 'NEXT_PUBLIC_API_BASE_URL must be a valid URL',
  }),
  NEXT_PUBLIC_FRONTEND_URL: z.string().url({
    message: 'NEXT_PUBLIC_FRONTEND_URL must be a valid URL',
  }),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().min(1, {
    message: 'NEXT_PUBLIC_GOOGLE_CLIENT_ID is required',
  }),
});

/**
 * Type for validated environment variables
 */
type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables against the schema
 * Throws an error if validation fails
 * 
 * @returns Validated environment object
 */
function validateEnv(): Env {
  try {
    const env = envSchema.parse({
      NEXT_PUBLIC_API_BASE_URL: process.env['NEXT_PUBLIC_API_BASE_URL'],
      NEXT_PUBLIC_FRONTEND_URL: process.env['NEXT_PUBLIC_FRONTEND_URL'],
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env['NEXT_PUBLIC_GOOGLE_CLIENT_ID'],
    });

    logger.info('Environment variables validated successfully');
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Environment variable validation failed', {
        errors: error.issues,
      });

      // Format error messages for better readability
      const errorMessages = error.issues
        .map((err: z.ZodIssue) => `  - ${err.path.join('.')}: ${err.message}`)
        .join('\n');

      throw new Error(
        `Environment variable validation failed:\n${errorMessages}`
      );
    }

    throw error;
  }
}

/**
 * Validated environment variables
 * Use these instead of process.env for type safety
 */
export const env = validateEnv();

// API Configuration
export const API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL;

// Frontend URL
export const FRONTEND_URL = env.NEXT_PUBLIC_FRONTEND_URL;

// Google OAuth Configuration
export const GOOGLE_CLIENT_ID = env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
export const GOOGLE_REDIRECT_URI = typeof window !== 'undefined' 
  ? `${window.location.origin}/auth/google/callback` 
  : `${FRONTEND_URL}/auth/google/callback`;
