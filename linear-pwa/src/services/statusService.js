import linearApi from './linearApi';

// Cache for team and workflow states to avoid repeated API calls
let teamCache = null;
let workflowStatesCache = new Map();

// Get team ID (cached)
const getTeamId = async () => {
  if (teamCache) return teamCache;
  
  const teamsData = await linearApi.getTeams();
  teamCache = teamsData.teams?.nodes?.[0]?.id;
  
  if (!teamCache) {
    throw new Error('No team found');
  }
  
  return teamCache;
};

// Get workflow states for a team (cached)
const getWorkflowStates = async (teamId) => {
  if (workflowStatesCache.has(teamId)) {
    return workflowStatesCache.get(teamId);
  }
  
  const workflowStates = await linearApi.getWorkflowStates(teamId);
  workflowStatesCache.set(teamId, workflowStates);
  
  return workflowStates;
};

// Find target workflow state based on desired status
const findTargetState = (workflowStates, targetStatus) => {
  const states = workflowStates.team.states.nodes;
  
  switch (targetStatus) {
    case 'planned':
      return states.find(state => 
        state.type === 'unstarted' || state.type === 'backlog'
      );
    case 'started':
      return states.find(state => state.type === 'started');
    case 'completed':
      return states.find(state => state.type === 'completed');
    case 'canceled':
      return states.find(state => state.type === 'canceled');
    default:
      return states.find(state => state.type === 'unstarted');
  }
};

// Update task status
export const updateTaskStatus = async (taskId, newStatus) => {
  try {
    const teamId = await getTeamId();
    const workflowStates = await getWorkflowStates(teamId);
    const targetState = findTargetState(workflowStates, newStatus);
    
    if (!targetState) {
      throw new Error(`No workflow state found for status: ${newStatus}`);
    }
    
    await linearApi.updateIssue(taskId, {
      stateId: targetState.id
    });
    
    return { success: true, stateId: targetState.id };
  } catch (error) {
    console.error('Failed to update task status:', error);
    throw error;
  }
};

// Update project status
export const updateProjectStatus = async (projectId, newStatus) => {
  try {
    await linearApi.updateProject(projectId, {
      state: newStatus
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update project status:', error);
    throw error;
  }
};

// Bulk update multiple tasks
export const bulkUpdateTaskStatus = async (taskIds, newStatus) => {
  const results = [];
  
  for (const taskId of taskIds) {
    try {
      const result = await updateTaskStatus(taskId, newStatus);
      results.push({ taskId, success: true, result });
    } catch (error) {
      results.push({ taskId, success: false, error: error.message });
    }
  }
  
  return results;
};

// Clear cache (useful for testing or when team structure changes)
export const clearStatusCache = () => {
  teamCache = null;
  workflowStatesCache.clear();
};