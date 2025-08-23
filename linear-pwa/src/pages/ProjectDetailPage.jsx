import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, RefreshCw } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import StatusMenu from '../components/StatusMenu';
import linearApi from '../services/linearApi';
import './ProjectDetailPage.css';

function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const loadProject = async (showRefreshSpinner = false) => {
    try {
      if (showRefreshSpinner) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError('');
      
      const data = await linearApi.getProjectIssues(id);
      setProject(data.project);
      
      const sortedTasks = data.project.issues.nodes.sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate) - new Date(b.dueDate);
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      setTasks(sortedTasks);
    } catch (error) {
      setError('Failed to load project details. Please check your connection and try again.');
      console.error('Failed to load project:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [id]);

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
      // Get teams to find a team ID (use first available team for now)
      const teamsData = await linearApi.getTeams();
      const teamId = teamsData.teams?.nodes?.[0]?.id;
      
      if (!teamId) {
        console.error('No team found');
        return;
      }

      const issueInput = {
        title: taskData.title,
        teamId: teamId
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

  const handleRefresh = () => {
    loadProject(true);
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
          <div className="header-content">
            <button className="btn btn-icon btn-secondary" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </button>
            <div className="header-info">
              <h1 className="page-title">{project?.name}</h1>
              <span className={`status-badge status-${getStatusClass(project?.state)}`}>
                {getStatusDisplay(project?.state)}
              </span>
            </div>
            <button
              className="btn btn-icon btn-secondary refresh-btn"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw size={20} className={isRefreshing ? 'spinning' : ''} />
            </button>
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
    </div>
  );
}

export default ProjectDetailPage;