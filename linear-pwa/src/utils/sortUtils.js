import { getStatusOrder } from './statusUtils';

// Sort projects by status priority, then by creation date
export const sortProjectsByStatus = (projects) => {
  return [...projects].sort((a, b) => {
    const aOrder = getStatusOrder(a.state?.toLowerCase?.() || a.state);
    const bOrder = getStatusOrder(b.state?.toLowerCase?.() || b.state);
    
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    
    // If same status, sort by creation date (newest first)
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
};

// Sort tasks by status priority, then by creation date
export const sortTasksByStatus = (tasks) => {
  return [...tasks].sort((a, b) => {
    const aOrder = getStatusOrder(a.state?.type);
    const bOrder = getStatusOrder(b.state?.type);
    
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    
    // If same status, sort by creation date (newest first)
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
};

// Sort by due date (overdue first, then by date)
export const sortByDueDate = (items) => {
  return [...items].sort((a, b) => {
    const aDate = a.dueDate ? new Date(a.dueDate) : null;
    const bDate = b.dueDate ? new Date(b.dueDate) : null;
    
    // Items without due dates go to the end
    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;
    
    return aDate - bDate;
  });
};