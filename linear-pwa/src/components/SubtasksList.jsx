import { useState } from 'react';
import { Plus, Circle, Check, Play, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SwipeableCard from './common/SwipeableCard';
import StatusMenu from './StatusMenu';
import linearApi from '../services/linearApi';
import { formatDateShort } from '../utils/dateUtils';
import { renderMarkdownInline } from '../utils/markdownUtils';

function SubtasksList({ subtasks = [], parentId, onSubtasksChange, teamId, projectName }) {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskDescription, setNewSubtaskDescription] = useState('');
  const [newSubtaskDueDate, setNewSubtaskDueDate] = useState('');
  const [selectedSubtask, setSelectedSubtask] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Sort subtasks by status and due date (same as HomePage)
  const sortedSubtasks = [...subtasks].sort((a, b) => {
    const statusOrder = {
      'started': 0,
      'unstarted': 1,
      'backlog': 1,
      'completed': 2,
      'canceled': 3
    };
    
    const aOrder = statusOrder[a.state?.type] ?? 5;
    const bOrder = statusOrder[b.state?.type] ?? 5;
    
    if (aOrder !== bOrder) return aOrder - bOrder;
    
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    
    return 0;
  });

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || isCreating) return;
    
    setIsCreating(true);
    try {
      const subtaskInput = {
        title: newSubtaskTitle,
        description: newSubtaskDescription || undefined,
        dueDate: newSubtaskDueDate || undefined,
        teamId: teamId,
        parentId: parentId
      };
      
      const result = await linearApi.createSubtask(parentId, subtaskInput);
      
      if (result.issueCreate?.success) {
        // Reset form
        setNewSubtaskTitle('');
        setNewSubtaskDescription('');
        setNewSubtaskDueDate('');
        setShowAddForm(false);
        
        // Trigger parent to reload
        if (onSubtasksChange) {
          onSubtasksChange();
        }
      }
    } catch (error) {
      console.error('Failed to create subtask:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusChange = async (subtaskId, newStatus) => {
    try {
      const workflowStates = await linearApi.getWorkflowStates(teamId);
      
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
        await linearApi.updateIssue(subtaskId, { stateId: targetState.id });
        
        // Trigger parent to reload
        if (onSubtasksChange) {
          onSubtasksChange();
        }
        setSelectedSubtask(null);
      }
    } catch (error) {
      console.error('Failed to update subtask status:', error);
    }
  };

  const handleSubtaskComplete = (e, subtaskId) => {
    if (e && e.stopPropagation) e.stopPropagation();
    handleStatusChange(subtaskId, 'completed');
  };

  const handleMarkInProgress = (subtaskId) => {
    handleStatusChange(subtaskId, 'started');
  };

  const handleSubtaskLongPress = (subtask) => {
    setSelectedSubtask(subtask);
  };

  const getTaskIcon = (task) => {
    const stateType = task.state?.type;
    switch (stateType) {
      case 'completed':
        return <Check size={16} />;
      case 'started':
        return <Play size={14} />;
      case 'canceled':
        return <X size={16} />;
      default:
        return <Circle size={16} />;
    }
  };

  const getTaskStatusClass = (task) => {
    const stateType = task.state?.type;
    switch (stateType) {
      case 'unstarted':
      case 'backlog':
        return 'task-item-planned';
      case 'started':
        return 'task-item-started';
      case 'completed':
        return 'task-item-completed';
      case 'canceled':
        return 'task-item-canceled';
      default:
        return 'task-item-planned';
    }
  };

  const canMarkComplete = (task) => {
    return task.state?.type !== 'completed' && task.state?.type !== 'canceled';
  };

  const canMarkInProgress = (task) => {
    return task.state?.type !== 'started' && task.state?.type !== 'completed' && task.state?.type !== 'canceled';
  };

  const isTaskClickable = (task) => {
    return task.state?.type !== 'completed' && task.state?.type !== 'canceled';
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

  const handleSubtaskClick = (subtask) => {
    navigate(`/task/${subtask.id}`);
  };

  // Always show the subtasks section if we have a parentId (even if no subtasks yet)
  if (!parentId) {
    return null;
  }

  return (
    <div className="projects-list-compact" style={{ marginBottom: '16px' }}>
      <div className="project-group-compact">
        <div className="project-header-compact">
          <div 
            className="project-header-clickable"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <div className="project-header-left-compact">
              {isCollapsed ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
              <span className="project-name-compact">Subtasks</span>
            </div>
            <div 
              className={`project-badge-compact ${isCollapsed ? 'visible' : ''}`}
            >
              {subtasks.length}
            </div>
          </div>
          <button
            className="add-task-button"
            onClick={(e) => {
              e.stopPropagation();
              setShowAddForm(!showAddForm);
            }}
            title="Add subtask"
          >
            <Plus size={14} />
          </button>
        </div>

        {!isCollapsed && (
          <>
            {showAddForm && (
              <div style={{ padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginTop: '8px' }}>
                <input
                  type="text"
                  placeholder="Subtask title..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    marginBottom: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  autoFocus
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newSubtaskDescription}
                  onChange={(e) => setNewSubtaskDescription(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    marginBottom: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    minHeight: '60px',
                    resize: 'vertical',
                    fontSize: '14px'
                  }}
                  rows={2}
                />
                <input
                  type="date"
                  value={newSubtaskDueDate}
                  onChange={(e) => setNewSubtaskDueDate(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    marginBottom: '12px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewSubtaskTitle('');
                      setNewSubtaskDescription('');
                      setNewSubtaskDueDate('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleAddSubtask}
                    disabled={!newSubtaskTitle.trim() || isCreating}
                  >
                    {isCreating ? 'Creating...' : 'Add Subtask'}
                  </button>
                </div>
              </div>
            )}

            <div className="tasks-list-compact">
              {sortedSubtasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: '#999', fontSize: '14px' }}>
                  No subtasks yet
                </div>
              ) : (
                sortedSubtasks.map(subtask => (
                  <SwipeableCard
                    key={subtask.id}
                    onSwipeActionLeft={canMarkInProgress(subtask) ? () => handleMarkInProgress(subtask.id) : null}
                    onSwipeActionRight={canMarkComplete(subtask) ? (swipeDirection) => handleSubtaskComplete({ stopPropagation: () => {} }, subtask.id, swipeDirection) : null}
                    onLongPress={() => handleSubtaskLongPress(subtask)}
                    leftActionLabel="In Progress"
                    rightActionLabel="Complete"
                    disabled={!isTaskClickable(subtask)}
                  >
                    <div
                      className={`task-item-compact ${getTaskStatusClass(subtask)}`}
                      onClick={() => handleSubtaskClick(subtask)}
                    >
                      <button
                        className="task-checkbox-compact"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSubtaskLongPress(subtask);
                        }}
                        title="Change task status"
                      >
                        {getTaskIcon(subtask)}
                      </button>
                      <div className="task-content-compact">
                        <div className="task-title-compact">
                          {subtask.title}
                        </div>
                        {subtask.description && (
                          <div
                            className="task-description-compact"
                            onClick={(e) => e.stopPropagation()}
                            dangerouslySetInnerHTML={{ __html: renderMarkdownInline(subtask.description) }}
                          />
                        )}
                      </div>
                      {subtask.dueDate && (
                        <button 
                          className={`task-date-compact clickable-date ${subtask.dueDate && new Date(subtask.dueDate) < new Date() && subtask.state?.type !== 'completed' && subtask.state?.type !== 'canceled' ? 'overdue' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/task/${subtask.id}`);
                          }}
                          title="View task details"
                        >
                          {formatDateShort(subtask.dueDate)}
                        </button>
                      )}
                      <button 
                        className={`status-badge status-${getStatusClass(subtask.state?.type)} clickable`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSubtaskLongPress(subtask);
                        }}
                        title="Click to change status"
                        style={{ marginLeft: '8px' }}
                      >
                        {getStatusDisplay(subtask.state?.type)}
                      </button>
                    </div>
                  </SwipeableCard>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {selectedSubtask && (
        <StatusMenu
          task={selectedSubtask}
          onStatusChange={handleStatusChange}
          onClose={() => setSelectedSubtask(null)}
        />
      )}
    </div>
  );
}

export default SubtasksList;