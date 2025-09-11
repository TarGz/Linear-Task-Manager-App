import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trash2, ExternalLink, MoreVertical, CheckCircle, AlertTriangle, HardDrive, RefreshCw } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import StatusMenu from '../components/StatusMenu';
import CodeMirrorMarkdownEditor from '../components/common/CodeMirrorMarkdownEditor';
import MarkdownPreview from '../components/common/MarkdownPreview';
import SubtasksList from '../components/SubtasksList';
import linearApi from '../services/linearApi';
import AppOverlay from '../components/common/AppOverlay';
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
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | editing | syncing | synced | error
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [teamId, setTeamId] = useState(null);
  const draftTimerRef = useRef(null);
  // Using full CodeMirror editor with a Preview toggle
  const [descMode, setDescMode] = useState('preview'); // 'preview' | 'edit'
  // Conflict detection
  const [baseline, setBaseline] = useState({
    title: '',
    description: '',
    dueDate: '',
    updatedAt: ''
  });
  const [conflict, setConflict] = useState(null); // { remote, pendingUpdate }

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
      
      // Get the task with subtasks using the updated API
      const taskData = await linearApi.getIssue(id);
      const foundTask = taskData.issue;
      
      // Get team ID for subtask operations
      const teamsData = await linearApi.getTeams();
      const team = teamsData.teams?.nodes?.[0];
      if (team) {
        setTeamId(team.id);
      }
      
      if (foundTask) {
        setTask(foundTask);
        setSubtasks(foundTask.children?.nodes || []);
        // Attempt to restore a locally saved draft
        try {
          const key = `draft:task:${id}`;
          const raw = localStorage.getItem(key);
          const draft = raw ? JSON.parse(raw) : null;
          if (draft && (draft.title || draft.description || draft.dueDate)) {
            setEditTitle(draft.title ?? foundTask.title);
            setEditDescription(draft.description ?? (foundTask.description || ''));
            setEditDueDate(draft.dueDate ?? (foundTask.dueDate ? foundTask.dueDate.split('T')[0] : ''));
            setHasChanges(true);
            setSaveStatus('draft');
          } else {
            setEditTitle(foundTask.title);
            setEditDescription(foundTask.description || '');
            setEditDueDate(foundTask.dueDate ? foundTask.dueDate.split('T')[0] : '');
            setHasChanges(false);
            setSaveStatus('synced');
          }
        } catch (_) {
          setEditTitle(foundTask.title);
          setEditDescription(foundTask.description || '');
          setEditDueDate(foundTask.dueDate ? foundTask.dueDate.split('T')[0] : '');
          setHasChanges(false);
          setSaveStatus('synced');
        }
        // Set baseline from server
        setBaseline({
          title: foundTask.title || '',
          description: foundTask.description || '',
          dueDate: foundTask.dueDate ? foundTask.dueDate.split('T')[0] : '',
          updatedAt: foundTask.updatedAt || ''
        });
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


  const handleSaveChanges = async (opts = {}) => {
    const force = !!opts.force; // when true, bypass conflict check once
    try {
      setIsSaving(true);
      setSaveStatus('syncing');
      
      let updateData = {};
      let hasUpdates = false;
      
      // Sanitize markdown links before saving (avoid localhost/invalid links in production)
      const base = (import.meta && import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : '/';
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const absoluteBase = origin + base;
      const sanitizeLinks = (md) => {
        if (!md) return md;
        let out = md;
        // Replace localhost dev links with the current origin/base
        out = out.replace(/\((?:http:\/\/localhost:\\d+)([^)]*)\)/g, (_, path) => `(${absoluteBase}${path.replace(/^\//,'')})`);
        // Convert root-relative links to absolute
        out = out.replace(/\((\/(?:[^)]+))\)/g, (_, path) => `(${absoluteBase}${path.replace(/^\//,'')})`);
        return out;
      };

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
        updateData.description = sanitizeLinks(editDescription);
        hasUpdates = true;
      }
      
      const currentDueDate = task?.dueDate ? task.dueDate.split('T')[0] : '';
      if (editDueDate !== currentDueDate) {
        updateData.dueDate = editDueDate || null;
        hasUpdates = true;
      }
      
      if (!hasUpdates) {
        setHasChanges(false);
        setSaveStatus('synced');
        setLastSavedAt(new Date().toISOString());
        return;
      }

      // Conflict detection: fetch latest remote and compare with baseline (unless forced)
      if (!force) {
        try {
          const remoteRes = await linearApi.getIssue(id);
          const remote = remoteRes.issue || remoteRes?.issue || remoteRes?.data?.issue; // be tolerant
          if (remote && baseline.updatedAt) {
            const remoteNewer = new Date(remote.updatedAt).getTime() > new Date(baseline.updatedAt).getTime();
            const baselineDiffers =
              remote.title !== baseline.title ||
              (remote.description || '') !== (baseline.description || '') ||
              (remote.dueDate ? remote.dueDate.split('T')[0] : '') !== (baseline.dueDate || '');
            if (remoteNewer && baselineDiffers) {
              // Show conflict overlay and exit early; user will choose
              setConflict({ remote, pendingUpdate: updateData });
              setIsSaving(false);
              setSaveStatus('editing');
              return;
            }
          }
        } catch (e) {
          // If we cannot check, proceed with save as a best-effort
        }
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
        // Keep editor fields in sync with server values to avoid false "Unsaved"
        setEditTitle(updatedIssue.title || '');
        setEditDescription(updatedIssue.description || '');
        setEditDueDate(updatedIssue.dueDate ? updatedIssue.dueDate.split('T')[0] : '');
        // Clear local draft since it's now synced
        try { localStorage.removeItem(`draft:task:${id}`); } catch (_) {}
        // Update baseline to new server state
        setBaseline({
          title: updatedIssue.title || '',
          description: updatedIssue.description || '',
          dueDate: updatedIssue.dueDate ? updatedIssue.dueDate.split('T')[0] : '',
          updatedAt: updatedIssue.updatedAt || ''
        });
        
        setHasChanges(false);
        setSaveStatus('synced');
        setLastSavedAt(new Date().toISOString());
      } else {
        console.error('Failed to update task: API returned success=false');
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const resolveConflictKeepMine = async () => {
    if (!conflict) return;
    setConflict(null);
    // Proceed with current local edits, bypassing conflict check
    await handleSaveChanges({ force: true });
  };

  const resolveConflictKeepTheirs = () => {
    if (!conflict) return;
    const r = conflict.remote;
    setEditTitle(r.title || '');
    setEditDescription(r.description || '');
    setEditDueDate(r.dueDate ? r.dueDate.split('T')[0] : '');
    setBaseline({
      title: r.title || '',
      description: r.description || '',
      dueDate: r.dueDate ? r.dueDate.split('T')[0] : '',
      updatedAt: r.updatedAt || ''
    });
    setHasChanges(false);
    setSaveStatus('synced');
    setConflict(null);
  };

  const discardChanges = () => {
    // Reset edit values to current task values
    setEditTitle(task?.title || '');
    setEditDescription(task?.description || '');
    setEditDueDate(task?.dueDate ? task.dueDate.split('T')[0] : '');
    setHasChanges(false);
    setSaveStatus('synced');
  };

  // Note: Removed auto-save on unmount to avoid accidental frequent syncs

  // Check for changes whenever edit values change
  const checkForChanges = () => {
    const titleChanged = editTitle !== (task?.title || '');
    const descriptionChanged = editDescription !== (task?.description || '');
    const dueDateChanged = editDueDate !== (task?.dueDate ? task.dueDate.split('T')[0] : '');
    
    const changed = titleChanged || descriptionChanged || dueDateChanged;
    setHasChanges(changed);
    setSaveStatus(changed ? 'editing' : 'synced');
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

  // Persist draft locally (debounced) to ensure no data loss
  useEffect(() => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      const key = `draft:task:${id}`;
      const draft = {
        title: editTitle,
        description: editDescription,
        dueDate: editDueDate,
        ts: Date.now()
      };
      try { 
        localStorage.setItem(key, JSON.stringify(draft));
        setSaveStatus(prev => (prev === 'editing' ? 'draft' : prev));
      } catch (_) {}
    }, 500);
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [id, editTitle, editDescription, editDueDate]);

  // Background interval sync removed per request — only Save Now or on exit

  // Attempt to save draft + sync on exit/reload (best-effort)
  useEffect(() => {
    const handler = (e) => {
      // Persist draft synchronously
      try {
        const key = `draft:task:${id}`;
        const draft = { title: editTitle, description: editDescription, dueDate: editDueDate, ts: Date.now() };
        localStorage.setItem(key, JSON.stringify(draft));
      } catch (_) {}
      // Optionally trigger a best-effort sync without blocking
      if (hasChanges) {
        try { handleSaveChanges(); } catch (_) {}
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasChanges, id, editTitle, editDescription, editDueDate]);

  // Pagehide/visibility autosave removed — only beforeunload and unmount

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
          {/* Subtasks Section - Only show if not a subtask itself */}
          {!task?.parent && (
            <SubtasksList 
              subtasks={subtasks}
              parentId={task?.id}
              teamId={teamId}
              onSubtasksChange={loadTask}
              projectName={task?.project?.name}
            />
          )}

          <div className="task-description card">
            <div className="desc-header-row">
              <div className="field-status">
                {saveStatus === 'syncing' && (
                  <span className="status-pill syncing"><RefreshCw size={14} className="spin" /> Syncing…</span>
                )}
                {saveStatus === 'synced' && (
                  <span className="status-pill synced"><CheckCircle size={14} /> Synced</span>
                )}
                {saveStatus === 'draft' && (
                  <span className="status-pill draft"><HardDrive size={14} /> Saved locally</span>
                )}
                {saveStatus === 'editing' && (
                  <span className="status-pill editing"><AlertTriangle size={14} /> Unsaved</span>
                )}
                {saveStatus === 'error' && (
                  <span className="status-pill error"><AlertTriangle size={14} /> Sync error</span>
                )}
              </div>
              <div className="mode-toggle">
                <button
                  className={descMode === 'preview' ? 'active' : ''}
                  onClick={() => setDescMode('preview')}
                >Preview</button>
                <button
                  className={descMode === 'edit' ? 'active' : ''}
                  onClick={() => setDescMode('edit')}
                >Edit</button>
              </div>
              <button
                className={`save-now ${isSaving || (!hasChanges && saveStatus !== 'error') ? 'disabled' : ''}`}
                onClick={handleSaveChanges}
                disabled={isSaving || (!hasChanges && saveStatus !== 'error')}
              >
                {isSaving ? 'Saving…' : 'Save Now'}
              </button>
            </div>

            {descMode === 'edit' ? (
              <div className="edit-description">
                <CodeMirrorMarkdownEditor value={editDescription} onChange={setEditDescription} />
              </div>
            ) : (
              <div style={{ marginTop: '8px' }}>
                <MarkdownPreview value={editDescription} />
              </div>
            )}
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

      {conflict && (
        <AppOverlay isOpen={true} onClose={() => setConflict(null)} title="Remote changes detected">
          <p style={{marginTop:0}}>This task was updated elsewhere since you started editing. Choose how to proceed:</p>
          <div className="conflict-box">
            <div>
              <h4>Remote</h4>
              <pre className="conflict-pre">{conflict.remote?.title || ''}\n\n{conflict.remote?.description || ''}</pre>
            </div>
            <div>
              <h4>Yours</h4>
              <pre className="conflict-pre">{editTitle}\n\n{editDescription}</pre>
            </div>
          </div>
          <div style={{display:'flex',gap:8,marginTop:12,justifyContent:'flex-end'}}>
            <button className="btn btn-secondary" onClick={() => setConflict(null)}>Cancel</button>
            <button className="btn" onClick={resolveConflictKeepTheirs}>Keep Theirs</button>
            <button className="btn btn-primary" onClick={resolveConflictKeepMine}>Keep Mine</button>
          </div>
        </AppOverlay>
      )}

      {/* Floating save chip removed – inline status used instead */}
    </div>
  );
}

export default TaskDetailPage;
