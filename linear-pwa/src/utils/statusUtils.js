import { LINEAR_STATUS_MAP, STATUS_LABELS } from '../config/constants';

// Convert Linear API status to internal status
export const normalizeStatus = (linearStatus) => {
  return LINEAR_STATUS_MAP[linearStatus] || 'planned';
};

// Get CSS class name for status
export const getStatusClass = (stateType) => {
  const internalStatus = normalizeStatus(stateType);
  const classMap = {
    'planned': 'planning',
    'started': 'progress', 
    'completed': 'done',
    'canceled': 'canceled'
  };
  return classMap[internalStatus];
};

// Get display label for status
export const getStatusDisplay = (stateType) => {
  const internalStatus = normalizeStatus(stateType);
  return STATUS_LABELS[internalStatus];
};

// Status order for sorting
export const getStatusOrder = (status) => {
  const statusOrder = {
    'started': 0,
    'unstarted': 1,
    'backlog': 1,
    'completed': 2,
    'canceled': 3
  };
  return statusOrder[status?.toLowerCase?.()] ?? statusOrder[status] ?? 4;
};