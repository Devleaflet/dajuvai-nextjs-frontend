/**
 * User Entity Types
 * Type definitions for users, addresses, and authentication
 */

import { ID, Timestamp } from '../common';

export type UserRole = 'ADMIN' | 'USER' | 'STAFF';

export type AuthProvider = 'LOCAL' | 'FACEBOOK' | 'GOOGLE';

export type Province =
  | 'Province 1'
  | 'Madhesh'
  | 'Bagmati'
  | 'Gandaki'
  | 'Lumbini'
  | 'Karnali'
  | 'Sudurpashchim';

export interface Address {
  id: ID;
  province?: Province;
  district?: string;
  city: string;
  localAddress?: string;
  landmark?: string;
  userId: ID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface User {
  id: ID;
  fullName?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  role: UserRole;
  address?: Address;
  addressId?: ID;
  googleId?: string;
  facebookId?: string;
  provider: AuthProvider;
  isVerified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserProfile extends User {
  orderCount?: number;
  wishlistCount?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  confirmPassword: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  username?: string;
  phoneNumber?: string;
}

export interface UpdateAddressInput {
  province?: Province;
  district?: string;
  city: string;
  localAddress?: string;
  landmark?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
