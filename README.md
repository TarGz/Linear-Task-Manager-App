# Linear Task Manager PWA v2.6.0

A Progressive Web App for managing your Linear projects and tasks with advanced features. Built with React, Vite, and the Linear API.

## Features

### Core Functionality
- 🔐 **Secure API Key Storage** - Store your Linear API key locally on your device
- 📱 **Mobile-First Design** - Optimized for mobile devices with touch gestures
- 🚀 **Offline Support** - Works offline with cached data
- 🔄 **Real-time Sync** - Syncs with Linear when online

### Project Management (v2.1.0)
- ⭐ **Favorites System** - Mark projects as favorites for quick access
- 🏠 **Dedicated Home Page** - View only your favorite projects on the home screen
- ✏️ **Project Editing** - Edit project names directly in the app
- 🗑️ **Project Management** - Delete projects with confirmation
- ➕ **Project Creation** - Create new projects directly from the app

### Task Management
- ↔️ **Swipe to Complete** - Swipe right on tasks to mark them as done
- 📱 **Contextual Menus** - Tap tasks to open status update menu (no more Linear redirects!)
- ⏰ **Long Press Support** - Long press for advanced actions
- 📊 **Multiple Views**:
  - **Favorites** - Quick access to your starred projects
  - **Projects** - See all your projects and their status  
  - **Project Detail** - View and manage tasks within a specific project
  - **All Tasks** - Global view of all tasks across projects

### Advanced Features
- 🏷️ **Smart Filtering** - Filter tasks by status (pending, in progress, done, overdue)
- 🎯 **Status Management** - Full status workflow support (Planning → In Progress → Done → Canceled)
- 🎨 **Modern UI** - Clean interface with consistent design patterns
- 📊 **Progress Tracking** - Visual progress indicators for projects

## Getting Started

### Prerequisites

- Node.js 18 or higher
- A Linear account with API access

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Linear-Task-Manager-App.git
cd Linear-Task-Manager-App/linear-pwa
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Setting up Linear API

1. Go to [Linear API Settings](https://linear.app/settings/api)
2. Create a new personal API key
3. Copy the API key
4. In the app, go to Settings and paste your API key
5. Click "Save API Key"

## Usage

### Navigation

- **Favorites Tab** (❤️) - Quick access to your favorite projects
- **Projects Tab** (🏠) - View all your Linear projects with create/manage options
- **All Tasks Tab** (☑️) - See tasks from all projects in one view
- **Settings Tab** (⚙️) - Manage your API key and app settings

### Gestures

- **Tap** - Open contextual menus for status updates
- **Long Press** - Alternative way to open contextual menus
- **Swipe Right** - Mark task or project as completed
- **Tap Project Title** - Navigate to project detail page
- **Tap Red FAB (+)** - Create new project (Projects page only)

### Filtering Tasks

In the All Tasks view:
- Use the filter button to show/hide filter options
- Filter by: All, Pending, In Progress, Done, Overdue
- Each filter shows the count of matching tasks

## Development

### Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── services/      # API and storage services  
├── styles/        # Global styles
└── utils/         # Utility functions
```

### Key Components

- `linearApi.js` - Linear API integration
- `storage.js` - IndexedDB for offline storage
- `BottomNav.jsx` - Main navigation component
- `TaskCard.jsx` - Task display with swipe gestures
- `ProjectCard.jsx` - Project display with swipe gestures

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment

This app is configured for GitHub Pages deployment:

1. Push to the `main` branch
2. GitHub Actions will automatically build and deploy
3. The app will be available at `https://yourusername.github.io/Linear-Task-Manager-App/`

## PWA Features

- **Service Worker** - Caches app and API responses
- **Offline Mode** - Works without internet connection
- **Background Sync** - Syncs changes when connection returns

## Security

- API keys are stored locally using localStorage
- No sensitive data is sent to third-party services
- HTTPS required for PWA features

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [Linear](https://linear.app) for the excellent API
- [Lucide React](https://lucide.dev) for beautiful icons
- [Vite PWA](https://vite-pwa-org.netlify.app) for PWA capabilities