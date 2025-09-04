import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, highlightActiveLine, placeholder as cmPlaceholder } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import './CodeMirrorMarkdownEditor.css';

function CodeMirrorMarkdownEditor({ value = '', onChange, placeholder = 'Write in Markdown…' }) {
  const hostRef = useRef(null);
  const viewRef = useRef(null);

  useEffect(() => {
    if (!hostRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const text = update.state.doc.toString();
        if (typeof onChange === 'function') onChange(text);
      }
    });

    const extensions = [
      markdown(),
      highlightActiveLine(),
      EditorView.lineWrapping,
      cmPlaceholder(placeholder),
      EditorView.theme({
        '&': { border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)' },
        '.cm-scroller': { fontFamily: 'inherit', fontSize: '14px' },
        '.cm-content': { padding: '12px' },
        '.cm-activeLine': { backgroundColor: 'rgba(0,0,0,0.03)' }
      })
    ];

    const state = EditorState.create({
      doc: value,
      extensions: [extensions, updateListener]
    });

    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Keep the editor in sync if outer value changes (but avoid resetting caret unnecessarily)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (value !== current) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value || '' }
      });
    }
  }, [value]);

  // Formatting helpers (operate via transactions to keep cursor stable)
  const applyWrap = (prefix, suffix = prefix) => {
    const view = viewRef.current; if (!view) return;
    const sel = view.state.selection.main; const doc = view.state.doc;
    const selected = doc.sliceString(sel.from, sel.to);
    const insert = `${prefix}${selected}${suffix}`;
    view.dispatch({ changes: [{ from: sel.from, to: sel.to, insert }], selection: { anchor: sel.from + prefix.length + selected.length } });
    view.focus();
  };

  const applyHeading = (level = 1) => {
    const view = viewRef.current; if (!view) return;
    const sel = view.state.selection.main; const doc = view.state.doc;
    const line = doc.lineAt(sel.from);
    const hashes = '#'.repeat(Math.max(1, Math.min(6, level)));
    const lineText = doc.sliceString(line.from, line.to);
    const trimmed = lineText.replace(/^#{1,6}\s+/, '');
    const newText = `${hashes} ${trimmed}`;
    view.dispatch({ changes: { from: line.from, to: line.to, insert: newText }, selection: { anchor: Math.min(line.from + newText.length, line.from + newText.length) } });
    view.focus();
  };

  const applyList = () => {
    const view = viewRef.current; if (!view) return;
    const sel = view.state.selection.main; const doc = view.state.doc;
    const startLine = doc.lineAt(sel.from).number; const endLine = doc.lineAt(sel.to).number;
    const changes = [];
    for (let ln = startLine; ln <= endLine; ln++) {
      const line = doc.line(ln);
      const text = doc.sliceString(line.from, line.to);
      const newText = text.startsWith('- ') ? text : `- ${text}`;
      changes.push({ from: line.from, to: line.to, insert: newText });
    }
    view.dispatch({ changes });
    view.focus();
  };

  const applyLink = () => {
    const view = viewRef.current; if (!view) return;
    const sel = view.state.selection.main; const doc = view.state.doc;
    const selected = doc.sliceString(sel.from, sel.to) || 'text';
    const template = `[${selected}](https://)`;
    const anchor = sel.from + selected.length + 3; // after ']( '
    view.dispatch({ changes: { from: sel.from, to: sel.to, insert: template }, selection: { anchor, head: anchor + 8 } });
    view.focus();
  };

  return (
    <div className="cm-md-editor">
      <div className="cm-toolbar">
        <button type="button" title="Bold" onClick={() => applyWrap('**')}><strong>B</strong></button>
        <button type="button" title="Italic" onClick={() => applyWrap('*')}><em>I</em></button>
        <span className="divider" />
        <button type="button" title="Heading 1" onClick={() => applyHeading(1)}>H1</button>
        <button type="button" title="Heading 2" onClick={() => applyHeading(2)}>H2</button>
        <span className="divider" />
        <button type="button" title="List" onClick={applyList}>• List</button>
        <button type="button" title="Link" onClick={applyLink}>Link</button>
      </div>
      <div className="cm-host" ref={hostRef} />
    </div>
  );
}

export default CodeMirrorMarkdownEditor;
