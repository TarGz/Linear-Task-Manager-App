import { useState, useEffect, useCallback } from 'react';
import { Clock, ChevronDown, ChevronRight, Circle, Plus, Check, X, Play, Filter, Bell, BellOff, Briefcase, Home, SortAsc } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TaskForm from '../components/TaskForm';
import SwipeableCard from '../components/common/SwipeableCard';
import StatusMenu from '../components/StatusMenu';
import linearApi from '../services/linearApi';
import { formatDateShort } from '../utils/dateUtils';
import { renderMarkdownInline } from '../utils/markdownUtils';
import { INTERNAL_STATUS, LINEAR_STATUS } from '../config/constants';
import { normalizeStatus } from '../utils/statusUtils';
import { useNotifications } from '../hooks/useNotifications';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]); // Store unfiltered data
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [collapsedProjects, setCollapsedProjects] = useState(new Set());
  const [motivationalQuote, setMotivationalQuote] = useState('');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedTaskForStatus, setSelectedTaskForStatus] = useState(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(() => {
    try { return localStorage.getItem('home.selectedFilter') || 'day'; } catch { return 'day'; }
  }); // 'all', 'day', 'week', 'month'
  const [workFilter, setWorkFilter] = useState(() => {
    try { return localStorage.getItem('home.workFilter') || 'all'; } catch { return 'all'; }
  }); // 'all', 'work', 'personal'
  const [sortMode, setSortMode] = useState(() => {
    try { return localStorage.getItem('home.sortMode') || 'project'; } catch { return 'project'; }
  }); // 'project' | 'due'
  const [dueSortedTasks, setDueSortedTasks] = useState([]);
  
  // Notifications hook
  const { requestPermission, checkTasksDue, hasPermission } = useNotifications();

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

  // Function to apply filters to the raw project data
  const applyFilters = useCallback((projectsList) => {
    // First, filter projects based on work/personal filter
    let filteredProjects = projectsList;
    
    if (workFilter !== 'all') {
      filteredProjects = projectsList.filter(project => {
        // Check for 🏢 emoji in name, [WORK] tag in description, OR Work label (for backward compatibility)
        const hasWorkName = project.name?.includes('🏢');
        const hasWorkTag = project.description?.includes('[WORK]');
        const hasWorkLabel = project.labels?.nodes?.some(label => label.name === 'Work');
        const isWorkProject = hasWorkName || hasWorkTag || hasWorkLabel;
        
        console.log(`Project: ${project.name}, HasWorkName: ${hasWorkName}, HasWorkTag: ${hasWorkTag}, HasWorkLabel: ${hasWorkLabel}, IsWorkProject: ${isWorkProject}`);
        
        if (workFilter === 'work') {
          // Only show work projects
          return isWorkProject;
        } else if (workFilter === 'personal') {
          // Only show personal projects (not work)
          return !isWorkProject;
        }
        return true;
      });
    }
    
    // Then apply time filters to tasks within remaining projects
    return filteredProjects.map(project => {
      // Calculate filter date based on selected filter
      let filterDate = null;
      if (selectedFilter !== 'all') {
        filterDate = new Date();
        switch (selectedFilter) {
          case 'day':
            filterDate.setDate(filterDate.getDate() - 1);
            break;
          case 'week':
            filterDate.setDate(filterDate.getDate() - 7);
            break;
          case 'month':
            filterDate.setMonth(filterDate.getMonth() - 1);
            break;
        }
      }
      
      const relevantTasks = project.allTasks.filter(task => {
        // Always show active tasks
        if (task.state?.type !== 'completed' && task.state?.type !== 'canceled') {
          return true;
        }
        
        // Filter completed/canceled tasks based on selected filter
        if (filterDate) {
          const updatedAt = new Date(task.updatedAt);
          return updatedAt > filterDate;
        }
        
        // If 'all' is selected, show all tasks
        return true;
      });

      return {
        ...project,
        tasks: relevantTasks
      };
    }).filter(project => project.tasks.length > 0);
  }, [selectedFilter, workFilter]);

  // Set random quote on component mount
  useEffect(() => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setMotivationalQuote(randomQuote);
  }, []);

  // Load data on mount
  useEffect(() => {
    loadProjectsWithTasks();
  }, []);

  // Persist filters and sort to localStorage
  useEffect(() => {
    try { localStorage.setItem('home.selectedFilter', selectedFilter); } catch {}
  }, [selectedFilter]);
  useEffect(() => {
    try { localStorage.setItem('home.workFilter', workFilter); } catch {}
  }, [workFilter]);
  useEffect(() => {
    try { localStorage.setItem('home.sortMode', sortMode); } catch {}
  }, [sortMode]);

  // Apply filters when selectedFilter or workFilter changes
  useEffect(() => {
    if (allProjects.length > 0) {
      const filteredProjects = applyFilters(allProjects);
      setProjects(filteredProjects);
    }
  }, [selectedFilter, workFilter, allProjects, applyFilters]);

  // Build due-date sorted flat list (active tasks with a due date), filtered by work/personal
  useEffect(() => {
    const all = allProjects.flatMap(p => p.allTasks || []);
    const activeWithDue = all.filter(t => t.dueDate && t.state?.type !== 'completed' && t.state?.type !== 'canceled');
    const filtered = activeWithDue.filter(t => {
      const proj = allProjects.find(p => p.id === t.project?.id);
      // Reuse project heuristics
      const hasWorkName = proj?.name?.includes('🏢');
      const hasWorkTag = proj?.description?.includes('[WORK]');
      const hasWorkLabel = proj?.labels?.nodes?.some(label => label.name === 'Work');
      const isWorkProject = hasWorkName || hasWorkTag || hasWorkLabel;
      if (workFilter === 'work') return isWorkProject;
      if (workFilter === 'personal') return !isWorkProject;
      return true;
    });
    filtered.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    setDueSortedTasks(filtered);
  }, [allProjects, workFilter]);

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
      
      // Process projects and their tasks (store all tasks)
      const processedProjects = projectsList.map(project => {
        const projectTasks = issuesByProject[project.id] || [];
        const sortedTasks = [...projectTasks].sort((a, b) => {
          // First by status priority: in-progress → todo → done → canceled
          const statusOrder = {
            'started': 0,      // in-progress
            'unstarted': 1,    // todo
            'backlog': 1,      // todo
            'completed': 2,    // done
            'canceled': 3      // canceled
          };
          
          const aOrder = statusOrder[a.state?.type] ?? 5;
          const bOrder = statusOrder[b.state?.type] ?? 5;
          
          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
          
          // Within same status, sort by due date (earliest first, null dates last)
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate) - new Date(b.dueDate);
          }
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
          
          // Finally by creation date (newest first)
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        return {
          ...project,
          allTasks: sortedTasks, // Store all tasks
          tasks: sortedTasks, // Will be filtered later
          // Calculate earliest due date for project sorting (only active tasks)
          earliestDueDate: sortedTasks
            .filter(task => task.dueDate && task.state?.type !== 'completed' && task.state?.type !== 'canceled')
            .map(task => new Date(task.dueDate))
            .sort((a, b) => a - b)[0] || null
        };
      });
      
      // Note: overdue list removed; overdue highlighting handled per-card

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
      
      // Store all projects data
      setAllProjects(processedProjects);
      
      // Apply initial filters
      const filteredProjects = applyFilters(processedProjects);
      setProjects(filteredProjects);
      
      // Initialize collapsed state based on project status
      // Projects with 'planned'/'backlog'/'todo' status should be collapsed (closed)
      // Projects with 'started'/'in_progress'/'active' status should be expanded (open)
      const newCollapsedProjects = new Set();
      filteredProjects.forEach(project => {
        const status = project.state?.toLowerCase();
        const isTodoStatus = ['planned', 'backlog', 'todo', 'planning'].includes(status);
        
        if (isTodoStatus) {
          newCollapsedProjects.add(project.id);
        }
        // in_progress/started projects remain open (not added to collapsed set)
      });
      
      setCollapsedProjects(newCollapsedProjects);
      
      // Check for due tasks and show notifications
      const allTasks = processedProjects.flatMap(p => p.allTasks || []);
      checkTasksDue(allTasks);
      
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

  // Helper function to update task status locally without full reload
  const updateTaskLocallyAndReorder = useCallback((taskId, newStatus, swipeDirection = 'right') => {
    // Step 1: Immediately add animating-out class to trigger slide-out animation
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskElement) {
      // Set transition and start slide-out from current position
      taskElement.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out, margin-bottom 0.3s ease, max-height 0.3s ease';
      taskElement.classList.add('animating-out');
      taskElement.classList.add(swipeDirection === 'left' ? 'animating-out-left' : 'animating-out-right');
    }
    
    // Step 2: After slide-out animation, update state and reorder
    setTimeout(() => {
      setProjects(prevProjects => {
        const updatedProjects = prevProjects.map(project => ({
          ...project,
          tasks: project.tasks.map(task => 
            task.id === taskId 
              ? { ...task, state: { ...task.state, type: newStatus }, isAnimatingIn: true, animationKey: Date.now() }
              : task
          )
        }));

        // Re-sort tasks within each project
        const sortedProjects = updatedProjects.map(project => ({
          ...project,
          tasks: [...project.tasks].sort((a, b) => {
            const statusOrder = {
              'started': 0,
              'unstarted': 1,
              'backlog': 1,
              'completed': 2,
              'canceled': 3
            };
            
            const aOrder = statusOrder[a.state?.type] ?? 5;
            const bOrder = statusOrder[b.state?.type] ?? 5;
            
            if (aOrder !== bOrder) {
              return aOrder - bOrder;
            }
            
            if (a.dueDate && b.dueDate) {
              return new Date(a.dueDate) - new Date(b.dueDate);
            }
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;
            
            return new Date(b.createdAt) - new Date(a.createdAt);
          })
        }));

        return sortedProjects;
      });
      
      // Step 3: Clean up animation flag after animation completes
      setTimeout(() => {
        setProjects(prevProjects => 
          prevProjects.map(project => ({
            ...project,
            tasks: project.tasks.map(task => 
              task.id === taskId 
                ? { ...task, isAnimatingIn: false }
                : task
            )
          }))
        );
      }, 500);
    }, 300);
  }, []);

  const toggleProject = async (projectId) => {
    const isCurrentlyCollapsed = collapsedProjects.has(projectId);
    
    // Update collapsed state immediately for UI responsiveness
    setCollapsedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
    
    // Update project status in Linear
    try {
      const newStatus = isCurrentlyCollapsed ? 'started' : 'planned';
      await linearApi.updateProject(projectId, { state: newStatus });
      
      // Update local project state
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === projectId 
            ? { ...project, state: newStatus }
            : project
        )
      );
    } catch (error) {
      console.error('Failed to update project status:', error);
      
      // Revert collapsed state if API call failed
      setCollapsedProjects(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyCollapsed) {
          newSet.add(projectId);
        } else {
          newSet.delete(projectId);
        }
        return newSet;
      });
    }
  };

  const handleTaskClick = (task) => {
    // Always navigate to task detail page
    navigate(`/task/${task.id}`);
  };

  const handleTaskComplete = async (e, taskId, swipeDirection = 'right') => {
    if (e && e.stopPropagation) e.stopPropagation();
    
    // Start animation immediately
    updateTaskLocallyAndReorder(taskId, 'completed', swipeDirection);
    // Reflect in due-date list immediately
    setDueSortedTasks(prev => {
      const exists = prev.some(t => t.id === taskId);
      if (!exists) return prev;
      return prev.filter(t => t.id !== taskId);
    });
    
    // Do API call in background
    try {
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
      } else {
        console.error('No "completed" state found in workflow states');
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      // TODO: Could revert animation on API failure
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

      // Check if the project is a work project
      const project = allProjects.find(p => p.id === taskData.projectId);
      let labelIds = [];
      
      console.log('🔍 Creating task for project:', project);
      
      const isWorkProject = project?.name?.includes('🏢') ||
                           project?.description?.includes('[WORK]') || 
                           project?.labels?.nodes?.some(label => label.name === 'Work');
      
      console.log('🔍 Project work indicators:', {
        hasWorkName: project?.name?.includes('🏢'),
        hasWorkTag: project?.description?.includes('[WORK]'),
        hasWorkLabel: project?.labels?.nodes?.some(label => label.name === 'Work'),
        isWorkProject
      });
      
      if (isWorkProject) {
        // This is a work project, ensure task gets Work label
        console.log('🏷️ This is a work project, getting Work label...');
        const workLabel = await linearApi.ensureWorkLabel();
        console.log('🏷️ Retrieved Work label:', workLabel);
        
        if (workLabel?.id) {
          labelIds = [workLabel.id];
          console.log('✅ Will create task with Work label ID:', workLabel.id);
        } else {
          console.log('❌ Could not get Work label ID');
        }
      } else {
        console.log('👤 This is a personal project, no Work label needed');
      }

      const submitData = {
        title: taskData.title,
        description: taskData.description || undefined,
        projectId: taskData.projectId,
        teamId: teamId,
        dueDate: taskData.dueDate || undefined,
        ...(labelIds.length > 0 && { labelIds })
      };

      console.log('🔄 Creating task with submitData:', submitData);
      console.log('🏷️ Label IDs being applied:', labelIds);
      
      const result = await linearApi.createIssue(submitData);
      console.log('✅ Task creation result:', result);
      
      if (result.issueCreate?.success) {
        // Close the form
        setShowCreateTask(false);
        
        // Reload projects to show the new task
        await loadProjectsWithTasks();
      } else {
        console.error('❌ Failed to create task - result not successful');
      }
    } catch (error) {
      console.error('❌ Failed to create task:', error);
    }
  };

  const handleTaskCancel = () => {
    setShowCreateTask(false);
  };


  // Use normalized status from utilities
  const getAppStatus = (task) => {
    return normalizeStatus(task.state?.type);
  };

  const getTaskStatusClass = (task) => {
    const appStatus = getAppStatus(task);
    switch (appStatus) {
      case INTERNAL_STATUS.PLANNED:
        return 'task-item-planned';
      case INTERNAL_STATUS.STARTED:
        return 'task-item-started';
      case INTERNAL_STATUS.COMPLETED:
        return 'task-item-completed';
      case INTERNAL_STATUS.CANCELED:
        return 'task-item-canceled';
      default:
        return '';
    }
  };

  const getTaskIcon = (task) => {
    const appStatus = getAppStatus(task);
    switch (appStatus) {
      case INTERNAL_STATUS.PLANNED:
        return <Circle size={16} />;
      case INTERNAL_STATUS.STARTED:
        return <Play size={16} />;
      case INTERNAL_STATUS.COMPLETED:
        return <Check size={16} />;
      case INTERNAL_STATUS.CANCELED:
        return <X size={16} />;
      default:
        return <Circle size={16} />;
    }
  };

  const isTaskClickable = (task) => {
    const status = task.state?.type;
    return status !== LINEAR_STATUS.COMPLETED; // Allow canceled tasks to be clickable/swipeable
  };

  // Check if task can be marked as "In Progress" (if it's not already in progress)
  const canMarkInProgress = (task) => {
    const appStatus = getAppStatus(task);
    return appStatus !== INTERNAL_STATUS.STARTED; // Allow canceled tasks to be marked as in progress
  };

  // Check if task can be marked as "Complete" (if it's not already completed - allow canceled tasks)
  const canMarkComplete = (task) => {
    const appStatus = getAppStatus(task);
    return appStatus !== INTERNAL_STATUS.COMPLETED;
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

  const handleMarkInProgress = async (taskId, swipeDirection = 'left') => {
    
    // Start animation immediately
    updateTaskLocallyAndReorder(taskId, 'started', swipeDirection);
    // Update due-date list state
    setDueSortedTasks(prev => {
      const idx = prev.findIndex(t => t.id === taskId);
      if (idx === -1) return prev;
      const updated = [...prev];
      updated[idx] = { ...updated[idx], state: { ...updated[idx].state, type: 'started' } };
      updated.sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate));
      return updated;
    });
    
    // Do API call in background
    try {
      const teamsData = await linearApi.getTeams();
      const teamId = teamsData.teams?.nodes?.[0]?.id;
      
      if (!teamId) {
        console.error('No team found');
        return;
      }

      const workflowStates = await linearApi.getWorkflowStates(teamId);
      
      const targetState = workflowStates.team.states.nodes.find(state => 
        state.type === LINEAR_STATUS.STARTED
      );
      
      if (targetState) {
        await linearApi.updateIssue(taskId, { stateId: targetState.id });
      } else {
        console.error('No "started" state found in workflow states');
      }
    } catch (error) {
      console.error('Failed to mark task as in progress:', error);
      // TODO: Could revert animation on API failure
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
        
        // Update task locally with smooth transition
        const linearToInternalStatus = {
          'completed': 'completed',
          'started': 'started', 
          'unstarted': 'unstarted',
          'backlog': 'unstarted',
          'canceled': 'canceled'
        };
        
        const internalStatus = linearToInternalStatus[targetState.type] || newStatus;
        updateTaskLocallyAndReorder(taskId, internalStatus);
        // Update due-date list
        setDueSortedTasks(prev => {
          const idx = prev.findIndex(t => t.id === taskId);
          if (idx === -1) return prev;
          if (internalStatus === 'completed' || internalStatus === 'canceled') {
            return prev.filter(t => t.id !== taskId);
          }
          const updated = [...prev];
          updated[idx] = { ...updated[idx], state: { ...updated[idx].state, type: internalStatus } };
          updated.sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate));
          return updated;
        });
        
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
        <div className="header-row-compact">
          <h1 className="page-title-compact">
            <Clock size={20} />
            {motivationalQuote}
          </h1>
          <div style={{display: 'flex', gap: '8px'}}>
            <button 
              className={`work-filter-toggle ${workFilter === 'work' ? 'active-work' : workFilter === 'personal' ? 'active-personal' : ''}`}
              onClick={() => {
                if (workFilter === 'all') setWorkFilter('work');
                else if (workFilter === 'work') setWorkFilter('personal');
                else setWorkFilter('all');
              }}
              title={workFilter === 'work' ? 'Showing work tasks' : workFilter === 'personal' ? 'Showing personal tasks' : 'Showing all tasks'}
              style={{
                background: workFilter === 'work' ? '#FF6B6B' : workFilter === 'personal' ? '#4ECDC4' : 'transparent',
                border: '1px solid',
                borderColor: workFilter !== 'all' ? 'transparent' : '#e0e0e0',
                borderRadius: '8px',
                padding: '6px 10px',
                cursor: 'pointer',
                color: workFilter !== 'all' ? 'white' : '#666',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: workFilter !== 'all' ? '600' : '400'
              }}
            >
              {workFilter === 'work' ? <Briefcase size={14} /> : workFilter === 'personal' ? <Home size={14} /> : null}
              {workFilter === 'work' ? 'Work' : workFilter === 'personal' ? 'Personal' : 'All'}
            </button>
            {/* Notification button removed per request */}
            <button
              className="filter-button-compact"
              onClick={() => setSortMode(prev => prev === 'project' ? 'due' : 'project')}
              title={`Sort: ${sortMode === 'project' ? 'Project' : 'Date'}`}
              aria-label="Toggle sort mode"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <SortAsc size={16} /> {sortMode === 'project' ? 'Project' : 'Date'}
            </button>
            <button 
              className="filter-button-compact"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              title="Filter old tasks"
              aria-label="Filter tasks by recency"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Filter size={18} />
              {selectedFilter !== 'all' && <span className="filter-badge"></span>}
            </button>
          </div>
        </div>
      </div>
      
      {/* Filter Menu */}
      {showFilterMenu && (
        <div className="filter-menu-overlay" onClick={() => setShowFilterMenu(false)}>
          <div className="filter-menu" onClick={(e) => e.stopPropagation()}>
            <div className="filter-menu-header">
              <h4>Filter Old Tasks</h4>
              <button onClick={() => setShowFilterMenu(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="filter-options">
              <button 
                className={`filter-option ${selectedFilter === 'all' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedFilter('all');
                  setShowFilterMenu(false);
                }}
              >
                <span>Show All Tasks</span>
                <Check size={16} style={{opacity: selectedFilter === 'all' ? 1 : 0}} />
              </button>
              <button 
                className={`filter-option ${selectedFilter === 'day' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedFilter('day');
                  setShowFilterMenu(false);
                }}
              >
                <span>Hide Older than 1 Day</span>
                <Check size={16} style={{opacity: selectedFilter === 'day' ? 1 : 0}} />
              </button>
              <button 
                className={`filter-option ${selectedFilter === 'week' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedFilter('week');
                  setShowFilterMenu(false);
                }}
              >
                <span>Hide Older than 1 Week</span>
                <Check size={16} style={{opacity: selectedFilter === 'week' ? 1 : 0}} />
              </button>
              <button 
                className={`filter-option ${selectedFilter === 'month' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedFilter('month');
                  setShowFilterMenu(false);
                }}
              >
                <span>Hide Older than 1 Month</span>
                <Check size={16} style={{opacity: selectedFilter === 'month' ? 1 : 0}} />
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="page-content-compact">
        {error && (
          <div className="error-message-compact">
            {error}
          </div>
        )}

        {sortMode === 'due' && (
          <div className="projects-list-compact" style={{marginBottom: '6px'}}>
            <div className="project-group-compact">
              <div className="tasks-list-compact">
                {dueSortedTasks.map(task => (
                  <SwipeableCard
                    key={`due-${task.id}`}
                    onSwipeActionLeft={canMarkInProgress(task) ? (swipeDirection) => handleMarkInProgress(task.id, swipeDirection) : null}
                    onSwipeActionRight={canMarkComplete(task) ? (swipeDirection) => handleTaskComplete({ stopPropagation: () => {} }, task.id, swipeDirection) : null}
                    onLongPress={() => handleTaskLongPress(task)}
                    leftActionLabel="In Progress"
                    rightActionLabel="Complete"
                    disabled={!isTaskClickable(task)}
                  >
                    <div
                      className={`task-item-compact ${getTaskStatusClass(task)}`}
                      onClick={() => handleTaskClick(task)}
                    >
                      <button
                        className="task-checkbox-compact"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskLongPress(task);
                        }}
                        title="Change task status"
                      >
                        {getTaskIcon(task)}
                      </button>
                      <div className="task-content-compact">
                        <div className="task-title-compact">
                          {task.title}
                        </div>
                        {task.description && (
                          <div
                            className="task-description-compact"
                            onClick={(e) => e.stopPropagation()}
                            dangerouslySetInnerHTML={{ __html: renderMarkdownInline(task.description) }}
                          />
                        )}
                      </div>
                      {task.dueDate && (
                        <button 
                          className={`task-date-compact clickable-date ${task.dueDate && new Date(task.dueDate) < new Date() && task.state?.type !== 'completed' && task.state?.type !== 'canceled' ? 'overdue' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/task/${task.id}`);
                          }}
                          title="View task details"
                        >
                          {formatDateShort(task.dueDate)}
                        </button>
                      )}
                    </div>
                  </SwipeableCard>
                ))}
              </div>
            </div>
          </div>
        )}


        {sortMode !== 'due' && (
          projects.length === 0 && !error ? (
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
                        key={`${task.id}-${task.animationKey || ''}`}
                        onSwipeActionLeft={canMarkInProgress(task) ? (swipeDirection) => handleMarkInProgress(task.id, swipeDirection) : null}
                        onSwipeActionRight={canMarkComplete(task) ? (swipeDirection) => handleTaskComplete({ stopPropagation: () => {} }, task.id, swipeDirection) : null}
                        onLongPress={() => handleTaskLongPress(task)}
                        leftActionLabel="In Progress"
                        rightActionLabel="Complete"
                        disabled={!isTaskClickable(task)}
                      >
                        <div
                          className={`task-item-compact ${getTaskStatusClass(task)} ${task.isAnimatingIn ? 'animating-in' : ''}`}
                          data-task-id={task.id}
                          onClick={() => handleTaskClick(task)}
                        >
                          <button
                            className="task-checkbox-compact"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskLongPress(task);
                            }}
                            title="Change task status"
                          >
                            {getTaskIcon(task)}
                          </button>
                          <div className="task-content-compact">
                            <div className="task-title-compact">
                              {task.title}
                            </div>
                            {task.description && (
                              <div
                                className="task-description-compact"
                                onClick={(e) => e.stopPropagation()}
                                dangerouslySetInnerHTML={{ __html: renderMarkdownInline(task.description) }}
                              />
                            )}
                          </div>
                          {task.dueDate && (
                            <button 
                              className={`task-date-compact clickable-date ${task.dueDate && new Date(task.dueDate) < new Date() && task.state?.type !== 'completed' && task.state?.type !== 'canceled' ? 'overdue' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/task/${task.id}`);
                              }}
                              title="View task details"
                            >
                              {formatDateShort(task.dueDate)}
                            </button>
                          )}
                        </div>
                      </SwipeableCard>
                    ))}
                  </div>
                )}
              </div>
              ))}
            </div>
          )
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
