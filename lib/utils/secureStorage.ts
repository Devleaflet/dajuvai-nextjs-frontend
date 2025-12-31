import CryptoJS from 'crypto-js';

/**
 * Secure storage utility for encrypting sensitive data in localStorage
 * 
 * @example
 * ```typescript
 * import { secureStorage } from '@/lib/utils/secureStorage';
 * 
 * // Store encrypted token
 * secureStorage.setItem('authToken', 'my-secret-token');
 * 
 * // Retrieve and decrypt token
 * const token = secureStorage.getItem('authToken');
 * 
 * // Remove token
 * secureStorage.removeItem('authToken');
 * ```
 */

// Generate a secret key from environment or use a default (should be in env in production)
const SECRET_KEY = process.env['NEXT_PUBLIC_STORAGE_SECRET'] || 'dajuvai-secure-storage-key-2024';

/**
 * Encrypt data using AES encryption
 */
function encrypt(data: string): string {
  return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
}

/**
 * Decrypt data using AES decryption
 */
function decrypt(encryptedData: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Secure storage object with encrypted localStorage operations
 */
export const secureStorage = {
  /**
   * Store an item in localStorage with encryption
   * 
   * @param key - The key to store the item under
   * @param value - The value to encrypt and store
   */
  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;

    try {
      const encrypted = encrypt(value);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Failed to encrypt and store item:', error);
      // Fallback to unencrypted storage if encryption fails
      localStorage.setItem(key, value);
    }
  },

  /**
   * Retrieve and decrypt an item from localStorage
   * 
   * @param key - The key to retrieve the item from
   * @returns The decrypted value or null if not found
   */
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;

    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      const decrypted = decrypt(encrypted);
      return decrypted || null;
    } catch (error) {
      console.error('Failed to decrypt item:', error);
      // Fallback to returning the raw value if decryption fails
      return localStorage.getItem(key);
    }
  },

  /**
   * Remove an item from localStorage
   * 
   * @param key - The key to remove
   */
  removeItem(key: string): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(key);
  },

  /**
   * Clear all items from localStorage
   */
  clear(): void {
    if (typeof window === 'undefined') return;

    localStorage.clear();
  },

  /**
   * Check if a key exists in localStorage
   * 
   * @param key - The key to check
   * @returns True if the key exists, false otherwise
   */
  hasItem(key: string): boolean {
    if (typeof window === 'undefined') return false;

    return localStorage.getItem(key) !== null;
  },
};

export default secureStorage;
