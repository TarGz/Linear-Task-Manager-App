import { Calendar, CheckSquare } from 'lucide-react';
import { useRef, useState } from 'react';
import './ProjectCard.css';

function ProjectCard({ project, onStatusChange, onClick }) {
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

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'planned': 'planning',
      'started': 'progress',
      'completed': 'done',
      'canceled': 'canceled'
    };
    return statusMap[status] || 'planning';
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      'planned': 'Planning',
      'started': 'In Progress',
      'completed': 'Done',
      'canceled': 'Canceled'
    };
    return statusMap[status] || 'Planning';
  };

  const taskCount = project.issues?.nodes?.length || 0;

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
        <h3 className="project-title">{project.name}</h3>
        <span className={`status-badge status-${getStatusClass(project.state)}`}>
          {getStatusDisplay(project.state)}
        </span>
      </div>
      
      {project.description && (
        <p className="project-description">{project.description}</p>
      )}
      
      <div className="project-footer">
        <div className="project-meta">
          <div className="meta-item">
            <CheckSquare size={14} />
            <span>{taskCount} task{taskCount !== 1 ? 's' : ''}</span>
          </div>
          {project.completedAt && (
            <div className="meta-item">
              <Calendar size={14} />
              <span>Completed {formatDate(project.completedAt)}</span>
            </div>
          )}
          {!project.completedAt && project.startedAt && (
            <div className="meta-item">
              <Calendar size={14} />
              <span>Started {formatDate(project.startedAt)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectCard;