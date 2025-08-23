# Linear Task Manager PWA - Project Brief

## Overview
Build a Progressive Web App (PWA) for managing Linear tasks, connecting through the Linear API and hosted on GitHub Pages.

## Core Features

### 1. Settings
- Settings page to configure and store Linear API key
- API key stored locally on the device (localStorage/IndexedDB)
- Validation of API key upon entry

### 2. Projects (Groups)
- Create and edit projects/groups
- Projects have the following statuses:
  - Planning
  - In Progress
  - Done
  - Canceled
- Swipe right on a project to mark it as done

### 3. Tasks
- Create tasks within projects
- Tasks have:
  - **Title** (mandatory)
  - **Description** (optional)
  - **Status** (Planning, In Progress, Done, Canceled)
  - **Due date**
- Swipe right on a task to mark it as done
- Tasks are sorted by due date when displayed

### 4. Navigation & Views

#### Home Page
- Displays all projects
- Shows project status
- Click on a project to view its tasks

#### Project Detail View
- Shows all tasks within a project
- Tasks sorted by due date
- Ability to add new tasks to the project

#### Todo Page
- Accessible from the home page
- Shows ALL tasks across all projects
- Global task view for quick overview

## UI/UX Requirements
- Clean, modern interface based on the provided UI kit (ui-kit.webp)
- Mobile-first design
- Smooth swipe gestures for task/project completion
- Coral/salmon color scheme (#F18173 primary color from design)
- Card-based layout for tasks and projects
- User avatars and visual status indicators
- Rounded corners on cards and buttons
- Status badges with color coding (green for done, purple for in progress, etc.)
- Bottom navigation for main sections
- Floating action button for quick task/project creation

## Technical Requirements
- Progressive Web App (PWA) capabilities
- Offline support
- Local storage for API key
- Integration with Linear API
- Responsive design
- Hosted on GitHub Pages

## Data Synchronization
- Sync with Linear API when online
- Cache data for offline access
- Handle conflicts appropriately

## Future Considerations
- Push notifications for due dates
- Collaborative features (assign tasks to team members)
- Task comments and attachments
- Time tracking
- Search and filter capabilities