// lib/sanitize.ts
import DOMPurify from 'dompurify';

const purifyConfig: DOMPurify.Config = {
  ALLOWED_TAGS: [
    // HTML básico
    'p',
    'br',
    'strong',
    'em',
    'u',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'a',
    'span',
    'div',
    'img',
  ],
  ALLOWED_ATTR: ['class', 'id', 'href', 'src', 'alt', 'target', 'rel', 'style'],
};

export function sanitize(html: string): string {
  return DOMPurify.sanitize(html, purifyConfig);
}
