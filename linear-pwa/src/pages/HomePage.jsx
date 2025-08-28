import { useState, useEffect } from 'react';
import { Clock, ChevronDown, ChevronRight, Circle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import linearApi from '../services/linearApi';
import { formatDateShort } from '../utils/dateUtils';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [collapsedProjects, setCollapsedProjects] = useState(new Set());

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
        // Get tasks for this project and filter out completed/canceled tasks
        const projectTasks = issuesByProject[project.id] || [];
        const activeTasks = projectTasks.filter(task => 
          task.state?.type !== 'completed' && task.state?.type !== 'canceled'
        );
        const sortedTasks = [...activeTasks].sort((a, b) => {
          // First sort by due date (earliest first, null dates last)
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate) - new Date(b.dueDate);
          }
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
          
          // Then by status priority
          const statusOrder = {
            'started': 0,
            'unstarted': 1,
            'backlog': 2,
            'completed': 3,
            'canceled': 4
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
          // Calculate earliest due date for project sorting
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

  if (isLoading) {
    return (
      <div className="home-page-compact">
        <div className="page-header-compact">
          <h1 className="page-title-compact">
            <Clock size={20} />
            Now
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
          Now
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
                <div 
                  className="project-header-compact"
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
                
                {!collapsedProjects.has(project.id) && (
                  <div className="tasks-list-compact">
                    {project.tasks.map(task => (
                      <div
                        key={task.id}
                        className="task-item-compact"
                        onClick={() => handleTaskClick(task)}
                      >
                        <button
                          className="task-checkbox-compact"
                          onClick={(e) => handleTaskComplete(e, task.id)}
                        >
                          <Circle size={16} />
                        </button>
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
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;