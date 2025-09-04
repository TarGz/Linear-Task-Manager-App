import { useRef } from 'react';
import './MarkdownEditor.css';

function MarkdownEditor({ value, onChange, placeholder = 'Write in Markdown…' }) {
  const textareaRef = useRef(null);

  const applyWrap = (prefix, suffix = prefix) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = value.slice(start, end);
    const wrapped = `${prefix}${selected || ''}${suffix}`;
    const next = value.slice(0, start) + wrapped + value.slice(end);
    onChange(next);
    // Restore caret
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + prefix.length + (selected ? selected.length : 0);
      el.setSelectionRange(caret, caret);
      autoResize(el);
    });
  };

  const applyHeading = (level = 1) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const hashes = '#'.repeat(Math.max(1, Math.min(6, level)));
    const next = value.slice(0, lineStart) + `${hashes} ` + value.slice(lineStart);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      autoResize(el);
    });
  };

  const applyList = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const before = value.slice(0, start);
    const selection = value.slice(start, end);
    const after = value.slice(end);
    const lines = (selection || '').split('\n');
    const transformed = lines
      .map(l => (l.trim().length ? (l.startsWith('- ') ? l : `- ${l}`) : '- '))
      .join('\n');
    const next = before + transformed + after;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      autoResize(el);
    });
  };

  const applyLink = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = value.slice(start, end) || 'text';
    const template = `[${selected}](https://)`;
    const next = value.slice(0, start) + template + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const linkStart = start + selected.length + 3; // after ']('
      const linkEnd = linkStart + 'https://'.length;
      el.setSelectionRange(linkStart, linkEnd);
      autoResize(el);
    });
  };

  const autoResize = (ta) => {
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.max(ta.scrollHeight, 120) + 'px';
  };

  return (
    <div className="md-editor">
      <div className="md-toolbar">
        <button type="button" title="Bold" onClick={() => applyWrap('**')}><strong>B</strong></button>
        <button type="button" title="Italic" onClick={() => applyWrap('*')}><em>I</em></button>
        <span className="divider" />
        <button type="button" title="Heading 1" onClick={() => applyHeading(1)}>H1</button>
        <button type="button" title="Heading 2" onClick={() => applyHeading(2)}>H2</button>
        <span className="divider" />
        <button type="button" title="List" onClick={applyList}>• List</button>
        <button type="button" title="Link" onClick={applyLink}>Link</button>
      </div>
      <textarea
        ref={textareaRef}
        className="md-textarea"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          autoResize(e.target);
        }}
      />
    </div>
  );
}

export default MarkdownEditor;

