import { AlertCircle } from 'lucide-react';
import './ErrorMessage.css';

function ErrorMessage({ 
  message, 
  onRetry, 
  size = "default" 
}) {
  if (!message) return null;
  
  return (
    <div className={`error-message ${size}`}>
      <div className="error-content">
        <AlertCircle size={size === "small" ? 16 : 20} className="error-icon" />
        <span className="error-text">{message}</span>
      </div>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="btn btn-secondary error-retry"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;