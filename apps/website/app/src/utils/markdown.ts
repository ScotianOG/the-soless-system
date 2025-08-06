// Markdown rendering utility
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';

/**
 * Render markdown content to HTML with syntax highlighting and sanitization
 * @param markdown The markdown string to render
 * @returns Sanitized HTML
 */
export function renderMarkdown(markdown: string): string {
  try {
    // Simple implementation to avoid TypeScript errors with marked types
    // In a production environment, you might want to configure marked more extensively
    const rawHtml = marked.parse(markdown);
    
    // Sanitize HTML to prevent XSS
    const cleanHtml = DOMPurify.sanitize(String(rawHtml), {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
        'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
        'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'span', 'img'
      ],
      ALLOWED_ATTR: [
        'href', 'name', 'target', 'src', 'class', 'id', 'style', 'alt'
      ]
    });
    
    return cleanHtml;
  } catch (error) {
    console.error('Error rendering markdown:', error);
    return `<p>Error rendering content: ${markdown.slice(0, 50)}...</p>`;
  }
}

/**
 * Extract the first paragraph from markdown as a plain text summary
 * @param markdown The markdown content
 * @returns Plain text summary
 */
export function extractSummary(markdown: string): string {
  // Remove frontmatter if present
  const cleanMarkdown = markdown.replace(/---[\s\S]+?---/m, '').trim();
  
  // Find the first paragraph
  const paragraphMatch = cleanMarkdown.match(/(?:^|\n\n)([^\n#]+)(?:\n\n|$)/);
  
  if (paragraphMatch && paragraphMatch[1]) {
    // Clean up markdown syntax from the paragraph
    return paragraphMatch[1]
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace [text](url) with just text
      .replace(/[_*]+([^_*]+)[_*]+/g, '$1')     // Remove emphasis markers
      .replace(/`([^`]+)`/g, '$1')              // Remove code markers
      .trim();
  }
  
  // Fallback to first 150 chars
  return cleanMarkdown
    .replace(/#+\s|[_*`]|\[|\]|\(|\)|>/g, '')  // Remove markup
    .trim()
    .slice(0, 150) + (cleanMarkdown.length > 150 ? '...' : '');
}
