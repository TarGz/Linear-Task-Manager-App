import { Calendar, User } from 'lucide-react';
import { useRef, useState } from 'react';
import './TaskCard.css';

function TaskCard({ task, onStatusChange, onClick }) {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef(null);

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    setCurrentX(e.touches[0].clientX);
    const diff = e.touches[0].clientX - startX;
    if (cardRef.current && diff > 0) {
      cardRef.current.style.transform = `translateX(${diff}px)`;
      cardRef.current.style.opacity = 1 - (diff / 200);
    }
  };

  const handleTouchEnd = () => {
    const diff = currentX - startX;
    if (diff > 100 && onStatusChange) {
      onStatusChange(task.id, 'done');
    }
    if (cardRef.current) {
      cardRef.current.style.transform = '';
      cardRef.current.style.opacity = '';
    }
    setIsDragging(false);
    setStartX(0);
    setCurrentX(0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'Backlog': 'planning',
      'Todo': 'planning',
      'In Progress': 'progress',
      'Done': 'done',
      'Canceled': 'canceled'
    };
    return statusMap[status] || 'planning';
  };

  return (
    <div
      ref={cardRef}
      className="task-card card"
      onClick={() => !isDragging && onClick && onClick(task)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="task-header">
        <h4 className="task-title">{task.title}</h4>
        <span className={`status-badge status-${getStatusClass(task.state?.name)}`}>
          {task.state?.name || 'Todo'}
        </span>
      </div>
      
      {task.description && (
        <p className="task-description">{task.description}</p>
      )}
      
      <div className="task-footer">
        <div className="task-meta">
          {task.dueDate && (
            <div className="meta-item">
              <Calendar size={14} />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}
          {task.assignee && (
            <div className="meta-item">
              {task.assignee.avatarUrl ? (
                <img src={task.assignee.avatarUrl} alt={task.assignee.name} className="avatar-mini" />
              ) : (
                <User size={14} />
              )}
              <span>{task.assignee.name}</span>
            </div>
          )}
        </div>
        {task.project && (
          <span className="task-project">{task.project.name}</span>
        )}
      </div>
    </div>
  );
}

export default TaskCard;