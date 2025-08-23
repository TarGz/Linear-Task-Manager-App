import { CheckSquare, Smartphone, Monitor, Megaphone, Package, Briefcase, Target, Lightbulb, Zap, Rocket, Star, Heart, Coffee, Camera, Music, Book, Code, Palette, Globe, Shield, Wrench } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import './ProjectCard.css';

function ProjectCard({ project, tasks = [], onStatusChange, onClick, onLongPress }) {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const [iconKey, setIconKey] = useState(null);
  const cardRef = useRef(null);

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

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
    setIsLongPress(false);
    
    // Start long press timer
    const timer = setTimeout(() => {
      setIsLongPress(true);
      if (onLongPress) {
        onLongPress(project, e);
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
      onStatusChange(project.id, 'completed');
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

  // Available project icons
  const availableIcons = {
    'package': Package,
    'briefcase': Briefcase,
    'target': Target,
    'lightbulb': Lightbulb,
    'zap': Zap,
    'rocket': Rocket,
    'star': Star,
    'heart': Heart,
    'coffee': Coffee,
    'camera': Camera,
    'music': Music,
    'book': Book,
    'code': Code,
    'palette': Palette,
    'globe': Globe,
    'shield': Shield,
    'wrench': Wrench,
    'monitor': Monitor,
    'smartphone': Smartphone,
    'megaphone': Megaphone,
    'checksquare': CheckSquare
  };

  // Get project icon based on stored preference or smart default
  const getProjectIcon = () => {
    const savedIcons = JSON.parse(localStorage.getItem('projectIcons') || '{}');
    const savedIconKey = iconKey || savedIcons[project.id];
    
    // If user has selected a custom icon, use it
    if (savedIconKey) {
      return availableIcons[savedIconKey] || availableIcons['package'];
    }
    
    // Otherwise use smart defaults based on project name
    const lowercaseName = project.name.toLowerCase();
    if (lowercaseName.includes('website') || lowercaseName.includes('web')) {
      return Monitor;
    } else if (lowercaseName.includes('mobile') || lowercaseName.includes('app')) {
      return Smartphone;
    } else if (lowercaseName.includes('marketing') || lowercaseName.includes('campaign')) {
      return Megaphone;
    } else if (lowercaseName.includes('code') || lowercaseName.includes('dev')) {
      return Code;
    } else if (lowercaseName.includes('design') || lowercaseName.includes('ui')) {
      return Palette;
    }
    return Package; // default
  };

  const ProjectIcon = getProjectIcon();

  return (
    <div
      ref={cardRef}
      className="project-card card"
      onClick={() => !isDragging && !isLongPress && onClick && onClick(project)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
  );
}

export default ProjectCard;