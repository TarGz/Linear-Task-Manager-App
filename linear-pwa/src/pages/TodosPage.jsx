import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Filter } from 'lucide-react';
import TaskCard from '../components/TaskCard';
import linearApi from '../services/linearApi';
import './TodosPage.css';

function TodosPage() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const filterOptions = [
    { value: 'all', label: 'All Tasks' },
    { value: 'pending', label: 'Pending' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'done', label: 'Completed' },
    { value: 'overdue', label: 'Overdue' }
  ];

  const loadTasks = async (showRefreshSpinner = false) => {
    try {
      if (showRefreshSpinner) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError('');
      
      const data = await linearApi.getAllIssues();
      
      const sortedTasks = data.issues.nodes.sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate) - new Date(b.dueDate);
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      setTasks(sortedTasks);
    } catch (error) {
      setError('Failed to load tasks. Please check your connection and try again.');
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const applyFilter = (tasks, filterType) => {
    const now = new Date();
    
    switch (filterType) {
      case 'pending':
        return tasks.filter(task => 
          task.state?.type !== 'completed' && task.state?.type !== 'canceled'
        );
      case 'in-progress':
        return tasks.filter(task => 
          task.state?.type === 'started' || 
          task.state?.name?.toLowerCase().includes('progress')
        );
      case 'done':
        return tasks.filter(task => task.state?.type === 'completed');
      case 'overdue':
        return tasks.filter(task => 
          task.dueDate && 
          new Date(task.dueDate) < now && 
          task.state?.type !== 'completed'
        );
      default:
        return tasks;
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    setFilteredTasks(applyFilter(tasks, filter));
  }, [tasks, filter]);

  const handleTaskClick = (task) => {
    window.open(`https://linear.app/issue/${task.id}`, '_blank');
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
      const doneState = workflowStates.team.states.nodes.find(state => 
        state.type === 'completed' || state.name.toLowerCase().includes('done')
      );
      
      if (doneState) {
        await linearApi.updateIssue(taskId, { stateId: doneState.id });
        
        // Update the task locally instead of reloading all tasks
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId 
              ? { 
                  ...task, 
                  state: { 
                    ...task.state, 
                    type: doneState.type,
                    id: doneState.id,
                    name: doneState.name 
                  } 
                }
              : task
          )
        );
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleRefresh = () => {
    loadTasks(true);
  };

  const getFilterCount = (filterType) => {
    return applyFilter(tasks, filterType).length;
  };

  if (isLoading) {
    return (
      <div className="todos-page">
        <div className="page-header">
          <div className="container">
            <h1 className="page-title">All Tasks</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="container">
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading tasks...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="todos-page">
      <div className="page-header">
        <div className="container">
          <div className="header-content">
            <h1 className="page-title">All Tasks</h1>
            <div className="header-actions">
              <button
                className="btn btn-icon btn-secondary filter-toggle"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={20} />
              </button>
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
      </div>

      {showFilters && (
        <div className="filters-section">
          <div className="container">
            <div className="filters-grid">
              {filterOptions.map(option => (
                <button
                  key={option.value}
                  className={`filter-btn ${filter === option.value ? 'active' : ''}`}
                  onClick={() => setFilter(option.value)}
                >
                  {option.label}
                  <span className="filter-count">
                    {getFilterCount(option.value)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="page-content">
        <div className="container">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="tasks-summary">
            <p>{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</p>
          </div>

          {filteredTasks.length === 0 && !error ? (
            <div className="empty-state">
              <h3>No tasks found</h3>
              <p>
                {filter === 'all' 
                  ? "You don't have any tasks yet. Create your first task in Linear to get started."
                  : `No ${filterOptions.find(f => f.value === filter)?.label.toLowerCase()} tasks found.`
                }
              </p>
            </div>
          ) : (
            <div className="tasks-list">
              {filteredTasks.map(task => (
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

      <button className="fab" onClick={() => window.open('https://linear.app', '_blank')}>
        <Plus size={24} />
      </button>
    </div>
  );
}

export default TodosPage;