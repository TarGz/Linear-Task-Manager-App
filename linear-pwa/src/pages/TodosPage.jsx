import { useState, useEffect } from 'react';
import { Plus, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TaskCard from '../components/TaskCard';
import StatusMenu from '../components/StatusMenu';
import ConfirmationPanel from '../components/common/ConfirmationPanel';
import linearApi from '../services/linearApi';
import './TodosPage.css';

function TodosPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);


  const loadTasks = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const data = await linearApi.getAllIssues();
      
      const sortedTasks = data.issues.nodes.sort((a, b) => {
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
    } catch (error) {
      setError('Failed to load tasks. Please check your connection and try again.');
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    setFilteredTasks(tasks);
  }, [tasks]);

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
      message: `Are you sure you want to delete "${task?.title}"? This action cannot be undone.`
    });
  };

  const confirmTaskDelete = async () => {
    if (!deleteConfirmation) return;
    
    try {
      const result = await linearApi.deleteIssue(deleteConfirmation.taskId);
      
      if (result.issueDelete?.success) {
        // Remove task from local state
        setTasks(prev => prev.filter(t => t.id !== deleteConfirmation.taskId));
      } else {
        setError('Failed to delete task. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      setError('Failed to delete task. Please try again.');
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
      if (newStatus === 'completed' || newStatus === 'done') {
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
        
        // Update the task locally instead of reloading all tasks
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
            <h1 className="page-title">
              <CheckSquare size={24} className="page-icon" />
              All Tasks
            </h1>
          </div>
        </div>
      </div>

      
      <div className="page-content">
        <div className="container">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}


          {filteredTasks.length === 0 && !error ? (
            <div className="empty-state">
              <h3>No tasks found</h3>
              <p>You don't have any tasks yet. Create your first task in Linear to get started.
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
                  onDelete={handleTaskDelete}
                  onLongPress={handleTaskLongPress}
                />
              ))}
            </div>
          )}
        </div>
      </div>


      {selectedTask && (
        <StatusMenu
          task={selectedTask}
          onStatusChange={handleStatusChange}
          onClose={() => setSelectedTask(null)}
        />
      )}

      <ConfirmationPanel
        isVisible={!!deleteConfirmation}
        title={deleteConfirmation?.title || ''}
        message={deleteConfirmation?.message || ''}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmTaskDelete}
        onCancel={() => setDeleteConfirmation(null)}
        type="danger"
      />
    </div>
  );
}

export default TodosPage;