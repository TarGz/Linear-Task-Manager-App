import { Check, Clock, Play, X } from 'lucide-react';
import { STATUS_COLORS, STATUS_LABELS } from '../config/constants';
import './ProjectStatusMenu.css';

function ProjectStatusMenu({ project, onStatusChange, onClose }) {
  const statuses = [
    { value: 'planned', label: STATUS_LABELS.planned, icon: Clock, color: STATUS_COLORS.planned },
    { value: 'started', label: STATUS_LABELS.started, icon: Play, color: STATUS_COLORS.started },
    { value: 'completed', label: STATUS_LABELS.completed, icon: Check, color: STATUS_COLORS.completed },
    { value: 'canceled', label: STATUS_LABELS.canceled, icon: X, color: STATUS_COLORS.canceled }
  ];

  const handleStatusSelect = (statusValue) => {
    onStatusChange(project.id, statusValue);
    onClose();
  };

  return (
    <div className="project-status-menu-overlay" onClick={onClose}>
      <div 
        className="project-status-menu card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="project-status-menu-header">
          <h4>Update Project Status</h4>
          <p className="project-title">{project.name}</p>
        </div>
        
        <div className="project-status-options">
          {statuses.map(status => {
            const Icon = status.icon;
            const isCurrentStatus = project.state === status.value;
            
            return (
              <button
                key={status.value}
                className={`project-status-option ${isCurrentStatus ? 'current' : ''}`}
                onClick={() => handleStatusSelect(status.value)}
                style={{ borderLeft: `4px solid ${status.color}` }}
              >
                <div className="project-status-option-icon" style={{ color: status.color }}>
                  <Icon size={16} />
                </div>
                <span className="project-status-option-label">{status.label}</span>
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

export default ProjectStatusMenu;