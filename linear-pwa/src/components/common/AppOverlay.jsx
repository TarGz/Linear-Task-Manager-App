import { createPortal } from 'react-dom';
import './AppOverlay.css';

function AppOverlay({ isOpen, onClose, variant = 'sheet', title, children }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="app-overlay" onClick={onClose}>
      <div
        className={`app-overlay-content ${variant}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <div className="app-overlay-header"><h4>{title}</h4></div>}
        <div className="app-overlay-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export default AppOverlay;

