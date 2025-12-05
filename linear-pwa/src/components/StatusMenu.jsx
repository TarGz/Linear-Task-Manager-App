import { Check, Clock, Play, X } from 'lucide-react';
import { STATUS_COLORS, STATUS_LABELS } from '../config/constants';
import AppOverlay from './common/AppOverlay';
import './StatusMenu.css';

function StatusMenu({ task, onStatusChange, onClose }) {
  const statuses = [
    { value: 'planned', label: STATUS_LABELS.planned, icon: Clock, color: STATUS_COLORS.planned },
    { value: 'started', label: STATUS_LABELS.started, icon: Play, color: STATUS_COLORS.started },
    { value: 'completed', label: STATUS_LABELS.completed, icon: Check, color: STATUS_COLORS.completed },
    { value: 'canceled', label: STATUS_LABELS.canceled, icon: X, color: STATUS_COLORS.canceled }
  ];

  const handleStatusSelect = (statusValue) => {
    onStatusChange(task.id, statusValue);
    onClose();
  };

  return (
    <AppOverlay
      isOpen={true}
      onClose={onClose}
      title="Update Status"
      subtitle={task.title}
    >
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
              className={`status-option status-${status.value} ${isCurrentStatus ? 'current' : ''}`}
              onClick={() => handleStatusSelect(status.value)}
            >
              <div className="status-option-icon">
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
    </AppOverlay>
  );
}

export default StatusMenu;
