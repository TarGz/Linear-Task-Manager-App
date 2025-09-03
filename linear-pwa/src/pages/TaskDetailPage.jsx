import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, ExternalLink, MoreVertical } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import StatusMenu from '../components/StatusMenu';
import linearApi from '../services/linearApi';
import './TaskDetailPage.css';

function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTaskActions, setShowTaskActions] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-resize textarea function
  const autoResizeTextarea = (textarea) => {
    if (!textarea) return;
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Set height to scrollHeight to fit content
    const newHeight = Math.max(textarea.scrollHeight, 60); // Minimum 60px height
    textarea.style.height = `${newHeight}px`;
  };

  const loadTask = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // For now, we'll get the task from the issues list
      const data = await linearApi.getAllIssues();
      const foundTask = data.issues.nodes.find(issue => issue.id === id);
      
      if (foundTask) {
        setTask(foundTask);
        setEditTitle(foundTask.title);
        setEditDescription(foundTask.description || '');
        setEditDueDate(foundTask.dueDate ? foundTask.dueDate.split('T')[0] : '');
        setHasChanges(false);
      } else {
        setError('Task not found');
      }
    } catch (error) {
      setError('Failed to load task details. Please check your connection and try again.');
      console.error('Failed to load task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTask();
  }, [id]);

  // Check for changes when edit values change
  useEffect(() => {
    if (task) {
      checkForChanges();
    }
  }, [editTitle, editDescription, editDueDate, task]);

  const handleTaskClick = (task, event) => {
    setSelectedTask(task);
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
        
        // Update the task locally
        setTask(prevTask => ({
          ...prevTask,
          state: {
            ...prevTask.state,
            type: targetState.type,
            id: targetState.id,
            name: targetState.name
          }
        }));
        
        setSelectedTask(null); // Close the menu
      } else {
        console.error('Target state not found for:', newStatus);
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };


  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      
      let updateData = {};
      let hasUpdates = false;
      
      // Check what has changed
      if (editTitle !== task?.title) {
        if (!editTitle.trim()) {
          console.error('Title cannot be empty');
          return;
        }
        updateData.title = editTitle;
        hasUpdates = true;
      }
      
      if (editDescription !== (task?.description || '')) {
        updateData.description = editDescription;
        hasUpdates = true;
      }
      
      const currentDueDate = task?.dueDate ? task.dueDate.split('T')[0] : '';
      if (editDueDate !== currentDueDate) {
        updateData.dueDate = editDueDate || null;
        hasUpdates = true;
      }
      
      if (!hasUpdates) {
        setHasChanges(false);
        return;
      }
      
      const response = await linearApi.updateIssue(id, updateData);
      
      if (response.issueUpdate.success) {
        // Update local state with response data
        const updatedIssue = response.issueUpdate.issue;
        setTask(prev => ({
          ...prev,
          title: updatedIssue.title,
          description: updatedIssue.description,
          dueDate: updatedIssue.dueDate,
          state: updatedIssue.state,
          updatedAt: updatedIssue.updatedAt
        }));
        
        setHasChanges(false);
      } else {
        console.error('Failed to update task: API returned success=false');
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const discardChanges = () => {
    // Reset edit values to current task values
    setEditTitle(task?.title || '');
    setEditDescription(task?.description || '');
    setEditDueDate(task?.dueDate ? task.dueDate.split('T')[0] : '');
    setHasChanges(false);
  };

  // Check for changes whenever edit values change
  const checkForChanges = () => {
    const titleChanged = editTitle !== (task?.title || '');
    const descriptionChanged = editDescription !== (task?.description || '');
    const dueDateChanged = editDueDate !== (task?.dueDate ? task.dueDate.split('T')[0] : '');
    
    setHasChanges(titleChanged || descriptionChanged || dueDateChanged);
  };

  const handleDeleteTask = async () => {
    try {
      setShowTaskActions(false);
      await linearApi.deleteIssue(id);
      navigate(-1);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleOpenInLinear = () => {
    window.open(`https://linear.app/issue/${task.id}`, '_blank');
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

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className="task-detail-page">
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
              <p>Loading task...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="task-detail-page">
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
    <div className={`task-detail-page ${hasChanges ? 'has-changes' : ''}`}>
      <div className="page-header">
        <div className="container">
          <div className="task-header-row">
            <button className="btn btn-icon btn-secondary" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </button>
            <div className="task-name-header">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="edit-task-input-header"
                placeholder="Task title..."
              />
            </div>
            <button
              className="btn btn-icon btn-secondary more-btn"
              onClick={() => setShowTaskActions(!showTaskActions)}
              title="More actions"
            >
              <MoreVertical size={20} />
            </button>
          </div>
          
          <div className="task-info-row">
            <div className="task-project-name">
              {task?.project?.name || 'Personal'}
            </div>
            <span className="separator">-</span>
            <button 
              className={`status-badge status-${getStatusClass(task?.state?.type)} clickable`}
              onClick={() => handleTaskClick(task)}
              title="Click to change status"
            >
              {getStatusDisplay(task?.state?.type)}
            </button>
          </div>
        </div>
      </div>
      
      {showTaskActions && (
        <div className="task-actions-overlay" onClick={() => setShowTaskActions(false)}>
          <div className="task-actions-menu" onClick={(e) => e.stopPropagation()}>
            <div className="task-actions-header">
              <h4>Task Actions</h4>
              <p className="task-title">{task?.title}</p>
            </div>
            <div className="task-actions-options">
              <button
                className="task-action-option"
                onClick={() => {
                  setShowTaskActions(false);
                  handleOpenInLinear();
                }}
              >
                <ExternalLink size={16} />
                <span>Open in Linear</span>
              </button>
              <button
                className="task-action-option delete"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
                    handleDeleteTask();
                  }
                }}
              >
                <Trash2 size={16} />
                <span>Delete Task</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="page-content">
        <div className="container">
          <div className="task-description card">
            <h3>Description</h3>
            <div className="edit-description">
              <textarea
                ref={(textarea) => {
                  if (textarea) autoResizeTextarea(textarea);
                }}
                value={editDescription}
                onChange={(e) => {
                  setEditDescription(e.target.value);
                  autoResizeTextarea(e.target);
                }}
                className="edit-task-textarea auto-resize"
                placeholder="Add a description..."
                style={{ minHeight: '60px', resize: 'none', overflow: 'hidden' }}
              />
            </div>
          </div>

          <div className="task-details card">
            <h3>Task Details</h3>
            
            <div className="detail-item">
              <strong>Status:</strong>
              <button 
                className={`status-badge status-${getStatusClass(task?.state?.type)} clickable`}
                onClick={() => handleTaskClick(task)}
                title="Click to change status"
              >
                {getStatusDisplay(task?.state?.type)}
              </button>
            </div>

            {task?.project && (
              <div className="detail-item">
                <strong>Project:</strong>
                <span>{task.project.name}</span>
              </div>
            )}

            {task?.assignee && (
              <div className="detail-item">
                <strong>Assignee:</strong>
                <div className="assignee-info">
                  {task.assignee.avatarUrl ? (
                    <img src={task.assignee.avatarUrl} alt={task.assignee.name} className="avatar" />
                  ) : (
                    <div className="avatar-placeholder">{task.assignee.name.charAt(0)}</div>
                  )}
                  <span>{task.assignee.name}</span>
                </div>
              </div>
            )}

            <div className="detail-item">
              <strong>Due Date:</strong>
              <div className="edit-due-date-inline">
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="edit-date-input"
                />
              </div>
            </div>

            <div className="detail-item">
              <strong>Created:</strong>
              <span>{formatDate(task?.createdAt)}</span>
            </div>

            <div className="detail-item">
              <strong>Updated:</strong>
              <span>{formatDate(task?.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>


      {selectedTask && (
        <StatusMenu
          task={selectedTask}
          onStatusChange={handleStatusChange}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* Global Save Bar */}
      {hasChanges && (
        <div className="global-save-bar">
          <div className="save-bar-content">
            <span className="changes-indicator">
              You have unsaved changes
            </span>
            <div className="save-bar-actions">
              <button
                className="btn btn-secondary btn-sm"
                onClick={discardChanges}
                disabled={isSaving}
              >
                Discard
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSaveChanges}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskDetailPage;