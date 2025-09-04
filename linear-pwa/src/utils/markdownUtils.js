import { renderMarkdown } from '../components/common/MarkdownPreview';

// Render markdown to compact, inline HTML suitable for single-line previews
export function renderMarkdownInline(md) {
  if (!md) return '';
  let html = renderMarkdown(md);
  // Flatten common block elements and lists to inline
  html = html
    .replace(/<\/?(h1|h2|p)>/g, ' ')
    .replace(/<ul>/g, ' ')
    .replace(/<\/ul>/g, ' ')
    .replace(/<li>/g, '')
    .replace(/<\/li>/g, ' • ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return html;
}

