import './MarkdownPreview.css';

export function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderMarkdown(md) {
  if (!md) return '';
  // Basic escaping first
  let text = escapeHtml(md);

  // Headings (H1/H2) at line start
  text = text.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  text = text.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links [text](https://...), [text](mailto:...), [text](tel:...), and [text](/relative)
  const base = (typeof window !== 'undefined') ? (document.querySelector('base')?.getAttribute('href') || (window.location.origin + (import.meta.env?.BASE_URL || '/'))) : '';
  // mailto links
  text = text.replace(/\[(.+?)\]\((mailto:[^\s)]+)\)/g, '<a href="$2">$1</a>');
  // tel links
  text = text.replace(/\[(.+?)\]\((tel:[^\s)]+)\)/g, '<a href="$2">$1</a>');
  text = text.replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  // absolute root-relative paths
  text = text.replace(/\[(.+?)\]\((\/[\S^)]+)\)/g, (_, label, path) => `<a href="${base}${path.replace(/^\//,'')}" target="_blank" rel="noopener noreferrer">${label}</a>`);

  // Autolink bare URLs and emails
  text = text.replace(/(^|\s)(https?:\/\/[^\s<>)+]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
  text = text.replace(/(^|\s)([\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/g, '$1<a href="mailto:$2">$2</a>');

  // Simple lists: group consecutive lines starting with "- ", "* ", or "+ " (optionally indented)
  const lines = text.split(/\n/);
  const out = [];
  let inList = false;
  for (const line of lines) {
    const m = line.match(/^\s*[-*+]\s+(.*)$/);
    if (m) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(`<li>${m[1]}</li>`);
    } else {
      if (inList) { out.push('</ul>'); inList = false; }
      if (line.trim().length === 0) {
        out.push('');
      } else {
        out.push(`<p>${line}</p>`);
      }
    }
  }
  if (inList) out.push('</ul>');

  return out.join('\n');
}

function MarkdownPreview({ value }) {
  const html = renderMarkdown(value || '');
  return (
    <div className="md-preview" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

export default MarkdownPreview;
