import { Calendar, CheckSquare, Smartphone } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import './ProjectCard.css';

function ProjectCard({ project, tasks = [], onStatusChange, onClick }) {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef(null);

  // Calculate progress (will be 0 for now since we don't have tasks)
  const totalTasks = project.issueCount || 0;
  const completedTasks = 0;
  const progressPercentage = 0;

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
      onStatusChange(project.id, 'completed');
    }
    if (cardRef.current) {
      cardRef.current.style.transform = '';
      cardRef.current.style.opacity = '';
    }
    setIsDragging(false);
    setStartX(0);
    setCurrentX(0);
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'planned': 'active',
      'started': 'progress',
      'completed': 'done',
      'canceled': 'canceled'
    };
    return statusMap[status] || 'active';
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      'planned': 'Active',
      'started': 'In Progress',
      'completed': 'Done',
      'canceled': 'Canceled'
    };
    return statusMap[status] || 'Active';
  };

  // Check if project is overdue
  const isOverdue = () => {
    if (!project.targetDate) return false;
    const targetDate = new Date(project.targetDate);
    const now = new Date();
    return targetDate < now && project.state !== 'completed';
  };

  const status = isOverdue() ? 'Overdue' : getStatusDisplay(project.state);
  const statusClass = isOverdue() ? 'overdue' : getStatusClass(project.state);

  return (
    <div
      ref={cardRef}
      className="project-card card"
      onClick={() => !isDragging && onClick && onClick(project)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="project-header">
        <div className="project-icon">
          <Smartphone size={20} />
        </div>
        <div className="project-info">
          <h3 className="project-title">{project.name}</h3>
          <span className={`status-badge status-${statusClass}`}>
            {status}
          </span>
        </div>
      </div>
      
      <div className="project-stats">
        <div className="stat-item">
          <Calendar size={14} />
          <span>Progress</span>
        </div>
        <div className="stat-value">
          {completedTasks}/{totalTasks} tasks
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-bar">
          <div 
            className={`progress-fill progress-${statusClass}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <span className="progress-text">{progressPercentage}% complete</span>
      </div>
    </div>
  );
}

export default ProjectCard;