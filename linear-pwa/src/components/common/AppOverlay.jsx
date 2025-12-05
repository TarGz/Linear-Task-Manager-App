import { createPortal } from 'react-dom';
import './AppOverlay.css';

/**
 * Unified overlay/bottom-sheet component for all popups in the app.
 * Always renders as a bottom sheet for consistency.
 *
 * Props:
 * - isOpen: boolean - controls visibility
 * - onClose: function - called when backdrop is clicked
 * - title: string - main title of the sheet
 * - subtitle: string (optional) - secondary text below title (e.g., task name)
 * - children: ReactNode - content to render in the sheet body
 */
function AppOverlay({ isOpen, onClose, title, subtitle, children }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="app-overlay-backdrop" onClick={onClose}>
      <div
        className="app-overlay-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        {(title || subtitle) && (
          <div className="app-overlay-header">
            {title && <h4 className="app-overlay-title">{title}</h4>}
            {subtitle && <p className="app-overlay-subtitle">{subtitle}</p>}
          </div>
        )}
        <div className="app-overlay-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export default AppOverlay;
