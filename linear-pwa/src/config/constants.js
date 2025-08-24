// App Configuration Constants
export const APP_VERSION = '2.5.1';
export const APP_DESCRIPTION = 'Enhanced Task & Project Management';
export const APP_FEATURES = 'Project & Task Detail Pages, Swipe Actions, Confirmation Panels, PWA Auto-Update, Cache Management, Linear Integration, Status Updates, Offline Support';
export const BUILD_DATE = import.meta.env.VITE_BUILD_DATE || new Date().toISOString();

// Status Colors Theme
export const STATUS_COLORS = {
  planned: '#FF6B6B',     // Light red for Todo
  started: '#7C4DFF',     // Purple for In Progress  
  completed: '#4CAF50',   // Green for Done
  canceled: '#9E9E9E'     // Grey for Canceled
};

// Status Labels Mapping
export const STATUS_LABELS = {
  planned: 'Todo',
  started: 'In Progress',
  completed: 'Done',
  canceled: 'Canceled'
};

// Linear API Status Mapping to our internal status
export const LINEAR_STATUS_MAP = {
  'unstarted': 'planned',
  'backlog': 'planned', 
  'started': 'started',
  'completed': 'completed',
  'canceled': 'canceled'
};