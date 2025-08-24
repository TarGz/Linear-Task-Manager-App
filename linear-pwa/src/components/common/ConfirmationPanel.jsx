import { X, AlertTriangle } from 'lucide-react';
import './ConfirmationPanel.css';

function ConfirmationPanel({ 
  isVisible, 
  title = "Confirm Delete", 
  message, 
  confirmText = "Delete", 
  cancelText = "Cancel",
  onConfirm, 
  onCancel,
  type = "danger" // danger, warning, info
}) {
  if (!isVisible) return null;

  return (
    <>
      <div className="confirmation-overlay" onClick={onCancel} />
      <div className={`confirmation-panel ${isVisible ? 'visible' : ''}`}>
        <div className="confirmation-header">
          <div className="confirmation-icon">
            <AlertTriangle size={20} />
          </div>
          <h3 className="confirmation-title">{title}</h3>
          <button 
            className="confirmation-close"
            onClick={onCancel}
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="confirmation-content">
          <p className="confirmation-message">{message}</p>
        </div>
        
        <div className="confirmation-actions">
          <button 
            className="btn btn-secondary confirmation-cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            className={`btn confirmation-confirm ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </>
  );
}

export default ConfirmationPanel;