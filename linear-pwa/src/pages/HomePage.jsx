import { useState, useEffect } from 'react';
import { Clock, ChevronDown, ChevronRight, Circle, Plus, Check, X, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TaskForm from '../components/TaskForm';
import SwipeableCard from '../components/common/SwipeableCard';
import StatusMenu from '../components/StatusMenu';
import linearApi from '../services/linearApi';
import { formatDateShort } from '../utils/dateUtils';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [collapsedProjects, setCollapsedProjects] = useState(new Set());
  const [motivationalQuote, setMotivationalQuote] = useState('');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedTaskForStatus, setSelectedTaskForStatus] = useState(null);

  // Short motivational quotes that fit in the title space
  const quotes = [
    "You got this!",
    "Just one swipe",
    "Small wins count",
    "Progress matters",
    "Keep going",
    "You can do it",
    "Make it happen",
    "Every step counts",
    "Stay focused",
    "Almost there",
    "Push through",
    "One task at a time",
    "You're doing great",
    "Keep momentum",
    "Trust the process"
  ];

  // Set random quote on component mount
  useEffect(() => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setMotivationalQuote(randomQuote);
  }, []);

  const loadProjectsWithTasks = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const data = await linearApi.getProjectsWithIssues();
      const projectsList = data.projects?.nodes || [];
      const issuesList = data.issues?.nodes || [];
      
      // Group issues by project
      const issuesByProject = {};
      issuesList.forEach(issue => {
        if (issue.project) {
          if (!issuesByProject[issue.project.id]) {
            issuesByProject[issue.project.id] = [];
          }
          issuesByProject[issue.project.id].push(issue);
        }
      });
      
      // Process projects and their tasks
      const processedProjects = projectsList.map(project => {
        // Get tasks for this project and filter out old completed/canceled tasks
        const projectTasks = issuesByProject[project.id] || [];
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        const relevantTasks = projectTasks.filter(task => {
          // Always show active tasks
          if (task.state?.type !== 'completed' && task.state?.type !== 'canceled') {
            return true;
          }
          
          // Show completed/canceled tasks only if they were updated within the last day
          const updatedAt = new Date(task.updatedAt);
          return updatedAt > oneDayAgo;
        });
        const sortedTasks = [...relevantTasks].sort((a, b) => {
          // First sort by due date (earliest first, null dates last)
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate) - new Date(b.dueDate);
          }
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
          
          // Then by status priority: in-progress → todo → completed → canceled
          const statusOrder = {
            'started': 0,      // in-progress
            'unstarted': 1,    // todo
            'backlog': 1,      // todo
            'completed': 2,    // completed
            'canceled': 3      // canceled
          };
          
          const aOrder = statusOrder[a.state?.type] ?? 5;
          const bOrder = statusOrder[b.state?.type] ?? 5;
          
          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
          
          // Finally by creation date (newest first)
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        return {
          ...project,
          tasks: sortedTasks,
          // Calculate earliest due date for project sorting (only active tasks)
          earliestDueDate: sortedTasks
            .filter(task => task.dueDate && task.state?.type !== 'completed' && task.state?.type !== 'canceled')
            .map(task => new Date(task.dueDate))
            .sort((a, b) => a - b)[0] || null
        };
      });
      
      // Sort projects by their earliest task due date
      processedProjects.sort((a, b) => {
        // Projects with no tasks go last
        if (a.tasks.length === 0 && b.tasks.length > 0) return 1;
        if (b.tasks.length === 0 && a.tasks.length > 0) return -1;
        if (a.tasks.length === 0 && b.tasks.length === 0) return 0;
        
        // Sort by earliest due date
        if (a.earliestDueDate && b.earliestDueDate) {
          return a.earliestDueDate - b.earliestDueDate;
        }
        if (a.earliestDueDate) return -1;
        if (b.earliestDueDate) return 1;
        
        // If no due dates, sort by project status
        const statusOrder = {
          'started': 0,
          'planned': 1,
          'completed': 2,
          'canceled': 3
        };
        
        const aOrder = statusOrder[a.state?.toLowerCase()] ?? 4;
        const bOrder = statusOrder[b.state?.toLowerCase()] ?? 4;
        
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        
        // Finally by creation date
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      // Filter out projects with no active tasks
      const projectsWithTasks = processedProjects.filter(project => project.tasks.length > 0);
      
      setProjects(projectsWithTasks);
    } catch (error) {
      setError('Failed to load projects and tasks. Please check your connection and try again.');
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjectsWithTasks();
  }, []);

  const toggleProject = (projectId) => {
    setCollapsedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const handleTaskClick = (task) => {
    navigate(`/task/${task.id}`);
  };

  const handleTaskComplete = async (e, taskId) => {
    e.stopPropagation();
    try {
      // Get teams to find a team ID
      const teamsData = await linearApi.getTeams();
      const teamId = teamsData.teams?.nodes?.[0]?.id;
      
      if (!teamId) {
        console.error('No team found');
        return;
      }

      const workflowStates = await linearApi.getWorkflowStates(teamId);
      const targetState = workflowStates.team.states.nodes.find(state => 
        state.type === 'completed'
      );
      
      if (targetState) {
        await linearApi.updateIssue(taskId, { stateId: targetState.id });
        
        // Remove the task from view immediately
        setProjects(prevProjects => 
          prevProjects.map(project => ({
            ...project,
            tasks: project.tasks.filter(task => task.id !== taskId)
          })).filter(project => project.tasks.length > 0)
        );
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleCreateTask = (projectId) => {
    setSelectedProjectId(projectId);
    setShowCreateTask(true);
  };

  const handleTaskSubmit = async (taskData) => {
    try {
      // Get teams to find a team ID
      const teamsData = await linearApi.getTeams();
      const teamId = teamsData.teams?.nodes?.[0]?.id;
      
      if (!teamId) {
        console.error('No team found');
        return;
      }

      const submitData = {
        title: taskData.title,
        description: taskData.description || undefined,
        projectId: taskData.projectId,
        teamId: teamId,
        dueDate: taskData.dueDate || undefined
      };

      const result = await linearApi.createIssue(submitData);
      
      if (result.issueCreate?.success) {
        // Close the form
        setShowCreateTask(false);
        
        // Reload projects to show the new task
        await loadProjectsWithTasks();
      } else {
        console.error('Failed to create task');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleTaskCancel = () => {
    setShowCreateTask(false);
  };

  // Linear Status to App Status Mapping
  const getAppStatus = (task) => {
    const linearStatus = task.state?.type;
    const linearStatusName = task.state?.name;
    console.log('Task:', task.title, 'Linear Type:', linearStatus, 'Linear Name:', linearStatusName);
    
    switch (linearStatus) {
      case 'started':   // "In Progress" or "In Review" in Linear
        return 'in-progress';
      case 'unstarted': // "Todo" in Linear  
        return 'todo';
      case 'backlog':   // "Backlog" in Linear - should be TODO, not canceled!
        return 'todo';
      case 'completed': // "Done" in Linear
        return 'completed';
      case 'canceled':  // "Canceled" in Linear
        return 'canceled';
      default:
        return 'todo';
    }
  };

  const getTaskStatusClass = (task) => {
    const appStatus = getAppStatus(task);
    switch (appStatus) {
      case 'todo':
        return 'task-item-planned';
      case 'in-progress':
        return 'task-item-started';
      case 'completed':
        return 'task-item-completed';
      case 'canceled':
        return 'task-item-canceled';
      default:
        return '';
    }
  };

  const getTaskIcon = (task) => {
    const appStatus = getAppStatus(task);
    switch (appStatus) {
      case 'todo':
        return <Circle size={16} />;
      case 'in-progress':
        return <Play size={16} />;
      case 'completed':
        return <Check size={16} />;
      case 'canceled':
        return <X size={16} />;
      default:
        return <Circle size={16} />;
    }
  };

  const isTaskClickable = (task) => {
    const status = task.state?.type;
    return status !== 'completed' && status !== 'canceled';
  };

  const handleTaskLongPress = (task) => {
    setSelectedTaskForStatus(task);
  };

  const handleTaskDelete = async (taskId) => {
    try {
      await linearApi.deleteIssue(taskId);
      
      // Remove the task from view immediately
      setProjects(prevProjects => 
        prevProjects.map(project => ({
          ...project,
          tasks: project.tasks.filter(task => task.id !== taskId)
        })).filter(project => project.tasks.length > 0)
      );
    } catch (error) {
      console.error('Failed to delete task:', error);
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
        
        // Update the task in projects
        setProjects(prevProjects => 
          prevProjects.map(project => ({
            ...project,
            tasks: project.tasks.map(task => 
              task.id === taskId 
                ? {
                    ...task,
                    state: {
                      ...task.state,
                      type: targetState.type,
                      id: targetState.id,
                      name: targetState.name
                    },
                    updatedAt: new Date().toISOString()
                  }
                : task
            )
          }))
        );
        
        setSelectedTaskForStatus(null);
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="home-page-compact">
        <div className="page-header-compact">
          <h1 className="page-title-compact">
            <Clock size={20} />
            {motivationalQuote || "Loading..."}
          </h1>
        </div>
        <div className="page-content-compact">
          <div className="loading-state">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page-compact">
      <div className="page-header-compact">
        <h1 className="page-title-compact">
          <Clock size={20} />
          {motivationalQuote}
        </h1>
      </div>
      
      <div className="page-content-compact">
        {error && (
          <div className="error-message-compact">
            {error}
          </div>
        )}

        {projects.length === 0 && !error ? (
          <div className="empty-state-compact">
            <p>No active tasks</p>
          </div>
        ) : (
          <div className="projects-list-compact">
            {projects.map(project => (
              <div key={project.id} className="project-group-compact">
                <div className="project-header-compact">
                  <div 
                    className="project-header-clickable"
                    onClick={() => toggleProject(project.id)}
                  >
                    <div className="project-header-left-compact">
                      {collapsedProjects.has(project.id) ? (
                        <ChevronRight size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                      <span className="project-name-compact">{project.name}</span>
                    </div>
                    <div 
                      className={`project-badge-compact ${collapsedProjects.has(project.id) ? 'visible' : ''}`}
                    >
                      {project.tasks.length}
                    </div>
                  </div>
                  <button
                    className="add-task-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateTask(project.id);
                    }}
                    title="Add task"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                
                {!collapsedProjects.has(project.id) && (
                  <div className="tasks-list-compact">
                    {project.tasks.map(task => (
                      <SwipeableCard
                        key={task.id}
                        onDelete={isTaskClickable(task) ? () => handleTaskDelete(task.id) : null}
                        onMarkDone={isTaskClickable(task) ? () => handleTaskComplete(null, task.id) : null}
                        onLongPress={() => handleTaskLongPress(task)}
                        deleteLabel="Delete"
                        markDoneLabel="Complete"
                        disabled={!isTaskClickable(task)}
                      >
                        <div
                          className={`task-item-compact ${getTaskStatusClass(task)}`}
                          onClick={() => handleTaskClick(task)}
                        >
                          {isTaskClickable(task) ? (
                            <button
                              className="task-checkbox-compact"
                              onClick={(e) => handleTaskComplete(e, task.id)}
                            >
                              {getTaskIcon(task)}
                            </button>
                          ) : (
                            <div className="task-checkbox-compact task-checkbox-disabled">
                              {getTaskIcon(task)}
                            </div>
                          )}
                          <div className="task-content-compact">
                            <div className="task-title-compact">
                              {task.title}
                            </div>
                            {task.description && (
                              <div className="task-description-compact">
                                {task.description.substring(0, 80)}
                                {task.description.length > 80 ? '...' : ''}
                              </div>
                            )}
                          </div>
                          {task.dueDate && (
                            <div className="task-date-compact">
                              {formatDateShort(task.dueDate)}
                            </div>
                          )}
                        </div>
                      </SwipeableCard>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Form */}
      {showCreateTask && (
        <TaskForm
          projectId={selectedProjectId}
          onSubmit={handleTaskSubmit}
          onCancel={handleTaskCancel}
        />
      )}

      {/* Status Menu */}
      {selectedTaskForStatus && (
        <StatusMenu
          task={selectedTaskForStatus}
          onStatusChange={handleStatusChange}
          onClose={() => setSelectedTaskForStatus(null)}
        />
      )}
    </div>
  );
}

export default HomePage;