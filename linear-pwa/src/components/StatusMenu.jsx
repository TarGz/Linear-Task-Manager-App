import { Check, Clock, Play, X } from 'lucide-react';
import './StatusMenu.css';

function StatusMenu({ task, onStatusChange, onClose }) {
  const statuses = [
    { value: 'planned', label: 'Todo', icon: Clock, color: '#FF6B6B' },
    { value: 'started', label: 'In Progress', icon: Play, color: '#7C4DFF' },
    { value: 'completed', label: 'Done', icon: Check, color: '#4CAF50' },
    { value: 'canceled', label: 'Canceled', icon: X, color: '#9E9E9E' }
  ];

  const handleStatusSelect = (statusValue) => {
    onStatusChange(task.id, statusValue);
    onClose();
  };

  return (
    <div className="status-menu-overlay" onClick={onClose}>
      <div 
        className="status-menu card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="status-menu-header">
          <h4>Update Status</h4>
          <p className="task-title">{task.title}</p>
        </div>
        
        <div className="status-options">
          {statuses.map(status => {
            const Icon = status.icon;
            const isCurrentStatus = task.state?.type === status.value || 
              (status.value === 'planned' && (task.state?.type === 'unstarted' || task.state?.type === 'backlog')) ||
              (status.value === 'started' && task.state?.type === 'started') ||
              (status.value === 'completed' && task.state?.type === 'completed') ||
              (status.value === 'canceled' && task.state?.type === 'canceled');
            
            return (
              <button
                key={status.value}
                className={`status-option ${isCurrentStatus ? 'current' : ''}`}
                onClick={() => handleStatusSelect(status.value)}
                style={{ borderLeft: `4px solid ${status.color}` }}
              >
                <div className="status-option-icon" style={{ color: status.color }}>
                  <Icon size={16} />
                </div>
                <span className="status-option-label">{status.label}</span>
                {isCurrentStatus && (
                  <div className="current-indicator">
                    <Check size={16} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default StatusMenu;