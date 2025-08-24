import { Calendar } from 'lucide-react';
import { useRef, useState } from 'react';
import './TaskCard.css';

function TaskCard({ task, onStatusChange, onClick, onLongPress, hideProjectName = false }) {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const cardRef = useRef(null);

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
    setIsLongPress(false);
    
    // Start long press timer
    const timer = setTimeout(() => {
      setIsLongPress(true);
      if (onLongPress) {
        onLongPress(task, e);
      }
    }, 500); // 500ms for long press
    
    setLongPressTimer(timer);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    // Clear long press timer on move
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    setCurrentX(e.touches[0].clientX);
    const diff = e.touches[0].clientX - startX;
    if (cardRef.current && diff > 0) {
      cardRef.current.style.transform = `translateX(${diff}px)`;
      cardRef.current.style.opacity = 1 - (diff / 200);
    }
  };

  const handleTouchEnd = () => {
    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    const diff = currentX - startX;
    
    // Handle swipe to complete if not a long press
    if (!isLongPress && diff > 100 && onStatusChange) {
      onStatusChange(task.id, 'completed');
    }
    
    if (cardRef.current) {
      cardRef.current.style.transform = '';
      cardRef.current.style.opacity = '';
    }
    setIsDragging(false);
    setStartX(0);
    setCurrentX(0);
    setIsLongPress(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusClass = (stateType) => {
    const statusMap = {
      'unstarted': 'planning',
      'backlog': 'planning', 
      'started': 'progress',
      'completed': 'done',
      'canceled': 'canceled'
    };
    return statusMap[stateType] || 'planning';
  };

  const getStatusDisplay = (stateType) => {
    const statusMap = {
      'unstarted': 'Todo',
      'backlog': 'Todo',
      'started': 'In Progress', 
      'completed': 'Done',
      'canceled': 'Canceled'
    };
    return statusMap[stateType] || 'Todo';
  };

  return (
    <div
      ref={cardRef}
      className="task-card card"
      onClick={(e) => !isDragging && !isLongPress && onClick && onClick(task, e)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="task-content">
        <div className="task-header-section">
          <h4 className="task-title">
            {task.title.substring(0, 25)}
            {task.title.length > 25 ? '...' : ''}
          </h4>
          <span className={`status-badge status-${getStatusClass(task.state?.type)}`}>
            {getStatusDisplay(task.state?.type)}
          </span>
        </div>
        
        <p className="task-mini-description">
          {task.description ? (
            <>
              {task.description.substring(0, 35)}
              {task.description.length > 35 ? '...' : ''}
            </>
          ) : (
            <span style={{opacity: 0}}>-</span>
          )}
        </p>
        
        <div className="task-bottom-row">
          <div className="task-due-date">
            {task.dueDate ? (
              <>
                <Calendar size={12} />
                <span>{formatDate(task.dueDate)}</span>
              </>
            ) : (
              <span style={{opacity: 0}}>-</span>
            )}
          </div>
          {task.project && !hideProjectName && (
            <span className="task-project">{task.project.name}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskCard;