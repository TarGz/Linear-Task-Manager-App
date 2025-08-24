import { CheckSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getProjectIcon } from '../utils/iconUtils';
import SwipeableCard from './common/SwipeableCard';
import './ProjectCard.css';

function ProjectCard({ project, tasks = [], onStatusChange, onDelete, onClick, onLongPress }) {
  const [iconKey, setIconKey] = useState(null);

  // Listen for icon changes
  useEffect(() => {
    const handleIconChange = (event) => {
      if (event.detail.projectId === project.id) {
        setIconKey(event.detail.iconKey);
      }
    };

    window.addEventListener('projectIconChanged', handleIconChange);
    return () => window.removeEventListener('projectIconChanged', handleIconChange);
  }, [project.id]);

  // Calculate progress from issues
  const issues = project.issues?.nodes || [];
  const totalTasks = issues.length;
  const completedTasks = issues.filter(issue => 
    issue.state?.type === 'completed'
  ).length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Debug logging for production
  if (totalTasks === 0) {
    console.log('ProjectCard Debug - Project with 0 tasks:', {
      projectName: project.name,
      projectId: project.id,
      hasIssues: !!project.issues,
      issuesNodes: project.issues?.nodes,
      rawProject: project
    });
  }

  const handleMarkDone = () => {
    if (onStatusChange && project.state !== 'completed') {
      onStatusChange(project.id, 'completed');
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(project.id);
    }
  };

  const handleClick = (e) => {
    if (onClick) {
      onClick(project, e);
    }
  };

  const handleLongPress = (e) => {
    if (onLongPress) {
      onLongPress(project, e);
    }
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
      'planned': 'Todo',
      'started': 'In Progress',
      'completed': 'Done',
      'canceled': 'Canceled'
    };
    return statusMap[status] || 'Todo';
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


  const ProjectIcon = getProjectIcon(project.id, project.name, iconKey);

  return (
    <SwipeableCard
      onDelete={handleDelete}
      onMarkDone={handleMarkDone}
      onLongPress={handleLongPress}
      deleteLabel="Delete"
      markDoneLabel={project.state === 'completed' ? 'Done' : 'Mark Done'}
      disabled={!onDelete && !onStatusChange}
    >
      <div
        className="project-card card"
        onClick={handleClick}
      >
        <div className="project-header">
          <div className="project-left">
            <div className="project-icon">
              <ProjectIcon size={20} />
            </div>
            <h3 className="project-title">{project.name}</h3>
          </div>
          <span className={`status-badge status-${statusClass}`}>
            {status}
          </span>
        </div>
        
        <div className="project-stats">
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
        </div>
      </div>
    </SwipeableCard>
  );
}

export default ProjectCard;