// App Configuration Constants
export const APP_VERSION = '2.7.5';
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

// Internal Status Constants  
export const INTERNAL_STATUS = {
  PLANNED: 'planned',
  STARTED: 'started', 
  COMPLETED: 'completed',
  CANCELED: 'canceled'
};

// Linear Status Constants
export const LINEAR_STATUS = {
  UNSTARTED: 'unstarted',
  BACKLOG: 'backlog',
  STARTED: 'started',
  COMPLETED: 'completed', 
  CANCELED: 'canceled'
};

// Linear API Status Mapping to our internal status
export const LINEAR_STATUS_MAP = {
  [LINEAR_STATUS.UNSTARTED]: INTERNAL_STATUS.PLANNED,
  [LINEAR_STATUS.BACKLOG]: INTERNAL_STATUS.PLANNED, 
  [LINEAR_STATUS.STARTED]: INTERNAL_STATUS.STARTED,
  [LINEAR_STATUS.COMPLETED]: INTERNAL_STATUS.COMPLETED,
  [LINEAR_STATUS.CANCELED]: INTERNAL_STATUS.CANCELED
};