import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeRichText } from './sanitize';

describe('sanitizeHtml', () => {
  describe('Safe HTML tags', () => {
    it('should allow safe HTML tags (b, i, em, strong)', () => {
      const input = '<p>This is <b>bold</b>, <i>italic</i>, <em>emphasized</em>, and <strong>strong</strong> text</p>';
      const result = sanitizeHtml(input);
      
      expect(result).toContain('<b>bold</b>');
      expect(result).toContain('<i>italic</i>');
      expect(result).toContain('<em>emphasized</em>');
      expect(result).toContain('<strong>strong</strong>');
    });

    it('should allow paragraph tags', () => {
      const input = '<p>This is a paragraph</p>';
      const result = sanitizeHtml(input);
      
      expect(result).toBe('<p>This is a paragraph</p>');
    });

    it('should allow br tags', () => {
      const input = '<p>Line 1<br>Line 2</p>';
      const result = sanitizeHtml(input);
      
      expect(result).toContain('<br>');
    });

    it('should allow anchor tags with href', () => {
      const input = '<a href="https://example.com">Link</a>';
      const result = sanitizeHtml(input);
      
      expect(result).toContain('<a');
      expect(result).toContain('href="https://example.com"');
      expect(result).toContain('>Link</a>');
    });

    it('should allow target attribute on links', () => {
      const input = '<a href="https://example.com" target="_blank">Link</a>';
      const result = sanitizeHtml(input);
      
      expect(result).toContain('target="_blank"');
    });
  });

  describe('Dangerous content removal', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("XSS")</script><p>Safe content</p>';
      const result = sanitizeHtml(input);
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('<p>Safe content</p>');
    });

    it('should remove onclick attributes', () => {
      const input = '<p onclick="alert(\'XSS\')">Click me</p>';
      const result = sanitizeHtml(input);
      
      expect(result).not.toContain('onclick');
      expect(result).toContain('Click me');
    });

    it('should remove onerror attributes', () => {
      const input = '<img src="x" onerror="alert(\'XSS\')">';
      const result = sanitizeHtml(input);
      
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('alert');
    });

    it('should remove javascript: protocol in href', () => {
      const input = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const result = sanitizeHtml(input);
      
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('alert');
    });

    it('should remove iframe tags', () => {
      const input = '<iframe src="https://evil.com"></iframe><p>Content</p>';
      const result = sanitizeHtml(input);
      
      expect(result).not.toContain('<iframe');
      expect(result).toContain('<p>Content</p>');
    });

    it('should remove object tags', () => {
      const input = '<object data="malicious.swf"></object><p>Content</p>';
      const result = sanitizeHtml(input);
      
      expect(result).not.toContain('<object');
      expect(result).toContain('<p>Content</p>');
    });

    it('should remove embed tags', () => {
      const input = '<embed src="malicious.swf"><p>Content</p>';
      const result = sanitizeHtml(input);
      
      expect(result).not.toContain('<embed');
      expect(result).toContain('<p>Content</p>');
    });

    it('should remove style tags', () => {
      const input = '<style>body { display: none; }</style><p>Content</p>';
      const result = sanitizeHtml(input);
      
      expect(result).not.toContain('<style>');
      expect(result).toContain('<p>Content</p>');
    });

    it('should remove link tags', () => {
      const input = '<link rel="stylesheet" href="evil.css"><p>Content</p>';
      const result = sanitizeHtml(input);
      
      expect(result).not.toContain('<link');
      expect(result).toContain('<p>Content</p>');
    });
  });

  describe('Disallowed tags', () => {
    it('should remove img tags (not in allowed list)', () => {
      const input = '<p>Text with <img src="image.jpg"> image</p>';
      const result = sanitizeHtml(input);
      
      expect(result).not.toContain('<img');
      expect(result).toContain('Text with');
      expect(result).toContain('image');
    });

    it('should remove div tags (not in allowed list)', () => {
      const input = '<div>Content in div</div>';
      const result = sanitizeHtml(input);
      
      expect(result).not.toContain('<div');
      expect(result).toContain('Content in div');
    });

    it('should remove span tags (not in allowed list)', () => {
      const input = '<span>Content in span</span>';
      const result = sanitizeHtml(input);
      
      expect(result).not.toContain('<span');
      expect(result).toContain('Content in span');
    });

    it('should remove h1-h6 tags (not in allowed list)', () => {
      const input = '<h1>Heading 1</h1><h2>Heading 2</h2>';
      const result = sanitizeHtml(input);
      
      expect(result).not.toContain('<h1');
      expect(result).not.toContain('<h2');
      expect(result).toContain('Heading 1');
      expect(result).toContain('Heading 2');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      const result = sanitizeHtml('');
      expect(result).toBe('');
    });

    it('should handle plain text without HTML', () => {
      const input = 'Just plain text';
      const result = sanitizeHtml(input);
      
      expect(result).toBe('Just plain text');
    });

    it('should handle malformed HTML', () => {
      const input = '<p>Unclosed paragraph';
      const result = sanitizeHtml(input);
      
      expect(result).toContain('Unclosed paragraph');
    });

    it('should handle nested tags', () => {
      const input = '<p><strong><em>Nested</em></strong></p>';
      const result = sanitizeHtml(input);
      
      expect(result).toBe('<p><strong><em>Nested</em></strong></p>');
    });

    it('should handle special characters', () => {
      const input = '<p>&lt;script&gt;alert("XSS")&lt;/script&gt;</p>';
      const result = sanitizeHtml(input);
      
      expect(result).toContain('&lt;script&gt;');
    });

    it('should handle unicode characters', () => {
      const input = '<p>Hello 世界 🌍</p>';
      const result = sanitizeHtml(input);
      
      expect(result).toBe('<p>Hello 世界 🌍</p>');
    });
  });

  describe('Allowed attributes', () => {
    it('should allow href attribute on anchor tags', () => {
      const input = '<a href="https://example.com">Link</a>';
      const result = sanitizeHtml(input);
      
      expect(result).toContain('href="https://example.com"');
    });

    it('should allow target attribute on anchor tags', () => {
      const input = '<a href="https://example.com" target="_blank">Link</a>';
      const result = sanitizeHtml(input);
      
      expect(result).toContain('target="_blank"');
    });

    it('should remove most disallowed attributes', () => {
      const input = '<p class="danger" id="test" data-value="123">Text</p>';
      const result = sanitizeHtml(input);
      
      expect(result).not.toContain('class');
      expect(result).not.toContain('id');
      // Note: DOMPurify allows data-* attributes by default
      expect(result).toContain('Text');
    });
  });
});

describe('sanitizeRichText', () => {
  describe('Additional allowed tags', () => {
    it('should allow heading tags (h1-h6)', () => {
      const input = '<h1>Heading 1</h1><h2>Heading 2</h2><h3>Heading 3</h3>';
      const result = sanitizeRichText(input);
      
      expect(result).toContain('<h1>Heading 1</h1>');
      expect(result).toContain('<h2>Heading 2</h2>');
      expect(result).toContain('<h3>Heading 3</h3>');
    });

    it('should allow list tags (ul, ol, li)', () => {
      const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = sanitizeRichText(input);
      
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>Item 1</li>');
      expect(result).toContain('</ul>');
    });

    it('should allow blockquote tags', () => {
      const input = '<blockquote>This is a quote</blockquote>';
      const result = sanitizeRichText(input);
      
      expect(result).toBe('<blockquote>This is a quote</blockquote>');
    });

    it('should allow code and pre tags', () => {
      const input = '<pre><code>const x = 10;</code></pre>';
      const result = sanitizeRichText(input);
      
      expect(result).toContain('<pre>');
      expect(result).toContain('<code>');
      expect(result).toContain('const x = 10;');
    });

    it('should allow class attribute', () => {
      const input = '<p class="highlight">Text</p>';
      const result = sanitizeRichText(input);
      
      expect(result).toContain('class="highlight"');
    });
  });

  describe('Still removes dangerous content', () => {
    it('should still remove script tags', () => {
      const input = '<h1>Title</h1><script>alert("XSS")</script>';
      const result = sanitizeRichText(input);
      
      expect(result).not.toContain('<script>');
      expect(result).toContain('<h1>Title</h1>');
    });

    it('should still remove onclick attributes', () => {
      const input = '<h1 onclick="alert(\'XSS\')">Title</h1>';
      const result = sanitizeRichText(input);
      
      expect(result).not.toContain('onclick');
      expect(result).toContain('Title');
    });
  });
});
