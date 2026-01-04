/**
 * Utility function to process and normalize image URLs
 * Handles Cloudinary URLs, relative paths, malformed URLs, and HTML-encoded URLs
 */

import { API_BASE_URL } from '@/lib/config';

/**
 * Decode HTML entities in a string
 */
function decodeHTMLEntities(text: string): string {
  // Handle common HTML entities
  const entities: Record<string, string> = {
    '&#x2F;': '/',
    '&#x3A;': ':',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
  };
  
  let decoded = text;
  
  // Replace hex entities
  decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  // Replace decimal entities
  decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(parseInt(dec, 10));
  });
  
  // Replace named entities
  Object.entries(entities).forEach(([entity, char]) => {
    decoded = decoded.split(entity).join(char);
  });
  
  return decoded;
}

export function processImageUrl(imgUrl: string): string {
  if (!imgUrl) return "";
  
  let trimmed = imgUrl.trim();
  if (!trimmed) return "";
  
  // Decode HTML entities first
  trimmed = decodeHTMLEntities(trimmed);
  
  // Handle protocol-relative URLs
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  
  // Check if URL is malformed (contains http/https in the middle)
  // Pattern 1: https://domain.com/https://cloudinary.com/...
  const malformedMatch = trimmed.match(/https?:\/\/[^/]+\/(https?:\/\/.+)/);
  if (malformedMatch) {
    return malformedMatch[1];
  }
  
  // Pattern 2: Look for any http/https that's not at the start
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    const httpMatch = trimmed.match(/(https?:\/\/.+)/);
    if (httpMatch) {
      return httpMatch[1];
    }
  }
  
  // If already absolute URL (http/https), return as-is
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  
  // If it's a root-relative path, return as-is
  if (trimmed.startsWith("/")) {
    return trimmed;
  }
  
  // Otherwise, prepend API_BASE_URL for relative paths
  const base = API_BASE_URL.replace(/\/?api\/?$/, "");
  const needsSlash = !trimmed.startsWith("/");
  const url = `${base}${needsSlash ? "/" : ""}${trimmed}`;
  
  // Clean up any double slashes (except after protocol)
  return url.replace(/([^:]\/)\/+/g, "$1");
}
