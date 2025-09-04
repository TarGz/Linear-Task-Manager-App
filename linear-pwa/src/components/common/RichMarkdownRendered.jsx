import { useEffect, useRef, useState } from 'react';
import { renderMarkdown } from './MarkdownPreview';
import './RichMarkdownRendered.css';

function serializeNode(node) {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue;
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  const tag = node.tagName.toLowerCase();
  const children = Array.from(node.childNodes).map(serializeNode).join('');
  switch (tag) {
    case 'strong':
    case 'b':
      return `**${children}**`;
    case 'em':
    case 'i':
      return `*${children}*`;
    case 'h1':
      return `# ${children}\n`;
    case 'h2':
      return `## ${children}\n`;
    case 'a': {
      const href = node.getAttribute('href') || '';
      return `[${children}](${href})`;
    }
    case 'li':
      return `- ${children}\n`;
    case 'ul':
      return `${Array.from(node.childNodes).map(serializeNode).join('')}`;
    case 'p':
      return `${children}\n`;
    case 'br':
      return `\n`;
    default:
      return children;
  }
}

function htmlToMarkdown(html) {
  const container = document.createElement('div');
  container.innerHTML = html;
  const md = Array.from(container.childNodes).map(serializeNode).join('');
  // normalize extra blank lines
  return md.replace(/\n{3,}/g, '\n\n').trimEnd();
}

export default function RichMarkdownRendered({ value, onChange }) {
  const ref = useRef(null);
  const [focused, setFocused] = useState(false);

  // Render HTML from markdown when value changes, but avoid while focused
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (focused) return; // don't touch DOM while user is typing
    const html = renderMarkdown(value || '');
    if (el.innerHTML !== html) {
      el.innerHTML = html;
    }
  }, [value, focused]);

  const focusEditor = () => { ref.current?.focus(); };

  const apply = (cmd, arg) => {
    focusEditor();
    document.execCommand(cmd, false, arg);
    // reflect back to markdown
    const html = ref.current?.innerHTML || '';
    onChange(htmlToMarkdown(html));
  };

  const onInput = () => {
    const html = ref.current?.innerHTML || '';
    onChange(htmlToMarkdown(html));
  };

  return (
    <div className="rte">
      <div className="rte-toolbar">
        <button type="button" onClick={() => apply('bold')}>B</button>
        <button type="button" onClick={() => apply('italic')}><em>I</em></button>
        <span className="divider" />
        <button type="button" onClick={() => apply('formatBlock', 'H1')}>H1</button>
        <button type="button" onClick={() => apply('formatBlock', 'H2')}>H2</button>
        <span className="divider" />
        <button type="button" onClick={() => apply('insertUnorderedList')}>• List</button>
        <button type="button" onClick={() => {
          const url = prompt('Link URL');
          if (url) apply('createLink', url);
        }}>Link</button>
      </div>
      <div
        ref={ref}
        className="rte-surface"
        contentEditable
        suppressContentEditableWarning
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          // normalize HTML after blur
          const el = ref.current;
          if (el) {
            const html = renderMarkdown(value || '');
            if (el.innerHTML !== html) el.innerHTML = html;
          }
        }}
        onInput={onInput}
      />
    </div>
  );
}

// Utilities to preserve caret/selection
function textNodesUnder(el) {
  const nodes = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  return nodes;
}

function getSelectionOffsets(root) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
  const nodes = textNodesUnder(root);
  let start = 0, end = 0, walk = 0;
  for (const n of nodes) {
    const len = n.nodeValue.length;
    if (n === range.startContainer) start = walk + range.startOffset;
    if (n === range.endContainer) { end = walk + range.endOffset; break; }
    walk += len;
  }
  return { start, end };
}

function restoreSelectionOffsets(root, { start, end }) {
  const nodes = textNodesUnder(root);
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  let walk = 0;
  let startNode = nodes[0] || root, startOffset = 0;
  let endNode = nodes[0] || root, endOffset = 0;
  for (const n of nodes) {
    const len = n.nodeValue.length;
    if (start >= walk && start <= walk + len) {
      startNode = n; startOffset = start - walk;
    }
    if (end >= walk && end <= walk + len) {
      endNode = n; endOffset = end - walk; break;
    }
    walk += len;
  }
  try {
    range.setStart(startNode, Math.max(0, Math.min(startOffset, startNode.nodeValue.length)));
    range.setEnd(endNode, Math.max(0, Math.min(endOffset, endNode.nodeValue.length)));
    sel.removeAllRanges();
    sel.addRange(range);
  } catch (_) {
    // Safely ignore if nodes changed dramatically
  }
}
