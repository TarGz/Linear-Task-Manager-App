import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, MoreVertical, ExternalLink, Palette, Package, Briefcase, Target, Lightbulb, Zap, Rocket, Star, Heart, Coffee, Camera, Music, Book, Code, Globe, Shield, Wrench, Monitor, Smartphone, Megaphone, CheckSquare } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import StatusMenu from '../components/StatusMenu';
// Icon editing removed; using standard icons only
import ConfirmationPanel from '../components/common/ConfirmationPanel';
import AppOverlay from '../components/common/AppOverlay';
import linearApi from '../services/linearApi';
import './ProjectDetailPage.css';
import { linearIconNameToEmoji } from '../utils/iconUtils';

function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showProjectActions, setShowProjectActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  // Icon selector disabled
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  const loadProject = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const data = await linearApi.getProjectIssues(id);
      setProject(data.project);
      
      const sortedTasks = data.project.issues.nodes.sort((a, b) => {
        // First sort by status priority: In Progress, Todo, Done, Canceled
        const statusOrder = {
          'started': 0,
          'unstarted': 1,
          'backlog': 1,
          'completed': 2,
          'canceled': 3
        };
        
        const aOrder = statusOrder[a.state?.type] ?? 4;
        const bOrder = statusOrder[b.state?.type] ?? 4;
        
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        
        // Within same status, sort by due date (earliest first)
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate) - new Date(b.dueDate);
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        
        // Finally, sort by creation date (newest first)
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      setTasks(sortedTasks);
      setEditName(data.project.name);
    } catch (error) {
      setError('Failed to load project details. Please check your connection and try again.');
      console.error('Failed to load project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [id]);

  const handleTaskClick = (task, event) => {
    navigate(`/task/${task.id}`);
  };

  const handleTaskLongPress = (task, event) => {
    setSelectedTask(task);
  };

  const handleTaskDelete = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    setDeleteConfirmation({
      taskId,
      title: 'Delete Task',
      message: `Are you sure you want to delete "${task?.title}"? This action cannot be undone.`,
      type: 'task'
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    
    try {
      if (deleteConfirmation.type === 'task') {
        const result = await linearApi.deleteIssue(deleteConfirmation.taskId);
        
        if (result.issueDelete?.success) {
          // Remove task from local state
          setTasks(prev => prev.filter(t => t.id !== deleteConfirmation.taskId));
        } else {
          setError('Failed to delete task. Please try again.');
        }
      } else if (deleteConfirmation.type === 'project') {
        setShowProjectActions(false);
        await linearApi.deleteProject(id);
        navigate(-1);
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      if (deleteConfirmation.type === 'task') {
        setError('Failed to delete task. Please try again.');
      } else {
        setError('Failed to delete project. Please try again.');
      }
    } finally {
      setDeleteConfirmation(null);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      // Get teams to find a team ID
      const teamsData = await linearApi.getTeams();
      const teamId = teamsData.teams?.nodes?.[0]?.id;
      
      if (!teamId) {
        console.error('No team found');
        return;
      }

      const workflowStates = await linearApi.getWorkflowStates(teamId);
      
      // Find the appropriate state based on the newStatus value
      let targetState;
      if (newStatus === 'completed') {
        targetState = workflowStates.team.states.nodes.find(state => 
          state.type === 'completed'
        );
      } else if (newStatus === 'started') {
        targetState = workflowStates.team.states.nodes.find(state => 
          state.type === 'started'
        );
      } else if (newStatus === 'planned') {
        targetState = workflowStates.team.states.nodes.find(state => 
          state.type === 'unstarted' || state.type === 'backlog'
        );
      } else if (newStatus === 'canceled') {
        targetState = workflowStates.team.states.nodes.find(state => 
          state.type === 'canceled'
        );
      }
      
      if (targetState) {
        await linearApi.updateIssue(taskId, { stateId: targetState.id });
        
        // Update the task locally instead of reloading entire project
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId 
              ? { 
                  ...task, 
                  state: { 
                    ...task.state, 
                    type: targetState.type,
                    id: targetState.id,
                    name: targetState.name 
                  } 
                }
              : task
          )
        );
        
        setSelectedTask(null); // Close the menu
      } else {
        console.error('Target state not found for:', newStatus);
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      // Use the project's team ID instead of getting all teams
      const projectTeamId = project?.teams?.nodes?.[0]?.id;

      if (!projectTeamId) {
        console.error('No team found for this project');
        alert('This project is not associated with a team. Please check the project settings in Linear.');
        return;
      }

      console.log('🔍 Creating task in team:', project.teams.nodes[0].name, 'with ID:', projectTeamId);

      const issueInput = {
        title: taskData.title,
        teamId: projectTeamId
      };

      // Only add optional fields if they have values
      if (taskData.description) {
        issueInput.description = taskData.description;
      }
      if (id) {
        issueInput.projectId = id;
      }
      if (taskData.priority && taskData.priority !== 'Medium') {
        issueInput.priority = taskData.priority === 'High' ? 1 : 3;
      }
      if (taskData.dueDate) {
        issueInput.dueDate = taskData.dueDate;
      }

      await linearApi.createIssue(issueInput);
      setShowTaskForm(false);
      await loadProject(); // Refresh to show new task
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };


  const handleEditProject = async () => {
    if (!editName.trim()) return;
    
    try {
      await linearApi.updateProject(id, { name: editName });
      setProject(prev => ({ ...prev, name: editName }));
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  // Auto-save project name on leave
  useEffect(() => {
    return () => {
      if (project && editName && editName !== project.name) {
        try { linearApi.updateProject(id, { name: editName }); } catch (_) {}
      }
    };
  }, [editName, project, id]);

  const handleDeleteProject = () => {
    // Close action sheet so it doesn't overlay the confirmation
    setShowProjectActions(false);
    // Defer opening confirmation until the sheet unmounts
    setTimeout(() => {
      setDeleteConfirmation({
        title: 'Delete Project',
        message: `Are you sure you want to delete "${project?.name}"? This action cannot be undone.`,
        type: 'project'
      });
    }, 0);
  };

  const handleOpenInLinear = () => {
    window.open(`https://linear.app/project/${project.id}`, '_blank');
  };

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

  // Get project icon: use standard local icon logic only
  const getProjectIcon = () => {
    const savedIcons = JSON.parse(localStorage.getItem('projectIcons') || '{}');
    const savedIconKey = savedIcons[project?.id];

    if (savedIconKey && availableIcons[savedIconKey]) {
      const Icon = availableIcons[savedIconKey];
      return <Icon size={16} className="project-header-icon" />;
    }

    const lowercaseName = project?.name?.toLowerCase() || '';
    let Icon = Package;

    if (lowercaseName.includes('website') || lowercaseName.includes('web')) {
      Icon = Monitor;
    } else if (lowercaseName.includes('mobile') || lowercaseName.includes('app')) {
      Icon = Smartphone;
    } else if (lowercaseName.includes('marketing') || lowercaseName.includes('campaign')) {
      Icon = Megaphone;
    } else if (lowercaseName.includes('code') || lowercaseName.includes('dev')) {
      Icon = Code;
    } else if (lowercaseName.includes('design') || lowercaseName.includes('ui')) {
      Icon = Palette;
    }

    return <Icon size={16} className="project-header-icon" />;
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

  if (isLoading) {
    return (
      <div className="project-detail-page">
        <div className="page-header">
          <div className="container">
            <div className="header-content">
              <button className="btn btn-icon btn-secondary" onClick={() => navigate(-1)}>
                <ArrowLeft size={20} />
              </button>
              <h1 className="page-title">Loading...</h1>
            </div>
          </div>
        </div>
        <div className="page-content">
          <div className="container">
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading project...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-detail-page">
        <div className="page-header">
          <div className="container">
            <div className="header-content">
              <button className="btn btn-icon btn-secondary" onClick={() => navigate(-1)}>
                <ArrowLeft size={20} />
              </button>
              <h1 className="page-title">Error</h1>
            </div>
          </div>
        </div>
        <div className="page-content">
          <div className="container">
            <div className="error-message">
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="project-detail-page">
      <div className="page-header">
        <div className="container">
          <div className="project-header-row">
            <button className="btn btn-icon btn-secondary" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </button>
            <div className="project-name">
              {isEditing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="edit-project-input-header"
                  autoFocus
                  onBlur={() => {
                    if (editName !== project?.name) {
                      handleEditProject();
                    } else {
                      setIsEditing(false);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleEditProject();
                    } else if (e.key === 'Escape') {
                      setEditName(project?.name);
                      setIsEditing(false);
                    }
                  }}
                />
              ) : (
                <span onClick={() => setIsEditing(true)} className="project-name-text">
                  {getProjectIcon()} {project?.name}
                </span>
              )}
            </div>
            <button
              className="btn btn-icon btn-secondary more-btn"
              onClick={() => setShowProjectActions(!showProjectActions)}
              title="More actions"
            >
              <MoreVertical size={20} />
            </button>
          </div>
          
          
          <div className="project-status-section">
            <span className={`status-badge status-${getStatusClass(project?.state)}`}>
              {getStatusDisplay(project?.state)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="page-content">
        <div className="container">
          {project?.description && (
            <div className="project-description card">
              <p>{project.description}</p>
            </div>
          )}

          <div className="tasks-section">
            <h2>Tasks ({tasks.length})</h2>
            
            {tasks.length === 0 ? (
              <div className="empty-state">
                <h3>No tasks found</h3>
                <p>This project doesn't have any tasks yet. Create your first task below.</p>
              </div>
            ) : (
              <div className="tasks-list">
                {tasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={handleTaskClick}
                    onStatusChange={handleStatusChange}
                    onDelete={handleTaskDelete}
                    onLongPress={handleTaskLongPress}
                    hideProjectName={true}
                  />
                ))}
              </div>
            )}

            <button 
              className="btn btn-primary add-new-task-btn"
              onClick={() => setShowTaskForm(true)}
            >
              <Plus size={20} />
              Add New Task
            </button>
          </div>
        </div>
      </div>

      {showTaskForm && (
        <TaskForm
          projectId={id}
          onSubmit={handleCreateTask}
          onCancel={() => setShowTaskForm(false)}
        />
      )}

      {selectedTask && (
        <StatusMenu
          task={selectedTask}
          onStatusChange={handleStatusChange}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {showProjectActions && (
        <AppOverlay isOpen={showProjectActions} onClose={() => setShowProjectActions(false)} variant="sheet" title="Project Actions">
          <p className="project-title" style={{ marginTop: 0 }}>{project?.name}</p>
          <div className="project-actions-options" style={{ padding: 0 }}>
            <button
              className="project-action-option"
              onClick={() => {
                setShowProjectActions(false);
                handleOpenInLinear();
              }}
            >
              <ExternalLink size={16} />
              <span>Open in Linear</span>
            </button>
            <button
              className="project-action-option delete"
              onClick={handleDeleteProject}
            >
              <Trash2 size={16} />
              <span>Delete Project</span>
            </button>
          </div>
        </AppOverlay>
      )}

      {/* Icon selector removed */}

      <ConfirmationPanel
        isVisible={!!deleteConfirmation}
        title={deleteConfirmation?.title || ''}
        message={deleteConfirmation?.message || ''}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmation(null)}
        type="danger"
      />
    </div>
  );
}

export default ProjectDetailPage;
