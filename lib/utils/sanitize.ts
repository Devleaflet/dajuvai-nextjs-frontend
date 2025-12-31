import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * 
 * @param dirty - The potentially unsafe HTML string
 * @returns Sanitized HTML string safe for rendering
 * 
 * @example
 * const userInput = '<script>alert("XSS")</script><p>Safe content</p>';
 * const clean = sanitizeHtml(userInput);
 * // Returns: '<p>Safe content</p>'
 * 
 * @example
 * const userComment = '<p>Check out <a href="https://example.com">this link</a></p>';
 * const clean = sanitizeHtml(userComment);
 * // Returns: '<p>Check out <a href="https://example.com">this link</a></p>'
 */
export function sanitizeHtml(dirty: string): string {
  // Configure DOMPurify with allowed tags and attributes
  const config = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
    // Ensure links open in new tab for security
    ADD_ATTR: ['target'],
  };

  // Sanitize the HTML
  const clean = DOMPurify.sanitize(dirty, config);

  return clean;
}

/**
 * Sanitize HTML for rich text content (allows more tags)
 * 
 * @param dirty - The potentially unsafe HTML string
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeRichText(dirty: string): string {
  const config = {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['href', 'target', 'class'],
    ADD_ATTR: ['target'],
  };

  const clean = DOMPurify.sanitize(dirty, config);

  return clean;
}
