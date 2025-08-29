import { Calendar } from 'lucide-react';
import { formatDateShort } from '../utils/dateUtils';
import { getStatusClass, getStatusDisplay } from '../utils/statusUtils';
import SwipeableCard from './common/SwipeableCard';
import './TaskCard.css';

function TaskCard({ task, onStatusChange, onDelete, onClick, onLongPress, hideProjectName = false }) {
  const handleMarkDone = () => {
    // Allow marking any non-completed task as done (including canceled tasks)
    if (onStatusChange && task.state?.type !== 'completed') {
      onStatusChange(task.id, 'completed');
    }
  };


  const handleDelete = () => {
    if (onDelete) {
      onDelete(task.id);
    }
  };

  const handleClick = (e) => {
    if (onClick) {
      onClick(task, e);
    }
  };

  const handleLongPress = (e) => {
    if (onLongPress) {
      onLongPress(task, e);
    }
  };

  return (
    <SwipeableCard
      onSwipeActionLeft={onDelete ? handleDelete : null}
      onSwipeActionRight={onStatusChange && task.state?.type !== 'completed' ? handleMarkDone : null}
      onLongPress={handleLongPress}
      leftActionLabel="Delete"
      rightActionLabel={task.state?.type === 'completed' ? 'Done' : 'Mark Done'}
      disabled={task.state?.type === 'completed'}
    >
      <div
        className="task-card card"
        onClick={handleClick}
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
                  <span>{formatDateShort(task.dueDate)}</span>
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
    </SwipeableCard>
  );
}

export default TaskCard;