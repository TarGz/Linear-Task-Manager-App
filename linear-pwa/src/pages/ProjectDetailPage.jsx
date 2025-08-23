import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, RefreshCw } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import TaskCard from '../components/TaskCard';
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

  const handleTaskClick = (task) => {
    window.open(`https://linear.app/issue/${task.id}`, '_blank');
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const workflowStates = await linearApi.getWorkflowStates('your-team-id');
      const doneState = workflowStates.team.states.nodes.find(state => 
        state.type === 'completed' || state.name.toLowerCase().includes('done')
      );
      
      if (doneState) {
        await linearApi.updateIssue(taskId, { stateId: doneState.id });
        await loadProject();
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
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
                <p>This project doesn't have any tasks yet. Create a task in Linear to get started.</p>
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
          </div>
        </div>
      </div>

      <button className="fab" onClick={() => window.open('https://linear.app', '_blank')}>
        <Plus size={24} />
      </button>
    </div>
  );
}

export default ProjectDetailPage;