/**
 * HTML Sanitization utility
 * Uses DOMPurify to prevent XSS attacks from user-generated or external HTML content
 */
import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Allows safe formatting tags while stripping scripts, event handlers, and dangerous attributes
 */
export function sanitizeHTML(html: string): string {
  if (!html) return '';

  return DOMPurify.sanitize(html, {
    // Allow common formatting tags
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span',
      'img', 'hr', 'sub', 'sup', 'mark', 's', 'del', 'ins'
    ],
    // Allow safe attributes
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel',
      'width', 'height', 'colspan', 'rowspan', 'align', 'valign'
    ],
    // Force links to open in new tab for security
    ADD_ATTR: ['target'],
    // Prevent data: and javascript: URLs
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    // Strip dangerous tags completely (not just sanitize)
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
    // Strip dangerous attributes
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur']
  });
}

/**
 * Sanitize HTML for document/editor content
 * More permissive than email sanitization - allows styling for rich text editing
 */
export function sanitizeDocHTML(html: string): string {
  if (!html) return '';

  return DOMPurify.sanitize(html, {
    // Allow all common HTML tags for rich text editing
    USE_PROFILES: { html: true },
    // Strip scripts and dangerous elements
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur']
  });
}
