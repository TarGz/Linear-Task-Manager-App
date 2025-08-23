import { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProjectCard from '../components/ProjectCard';
import ProjectForm from '../components/ProjectForm';
import ProjectStatusMenu from '../components/ProjectStatusMenu';
import linearApi from '../services/linearApi';
import './ProjectsPage.css';

function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const loadProjects = async (showRefreshSpinner = false) => {
    try {
      if (showRefreshSpinner) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError('');
      
      const data = await linearApi.getProjects();
      
      const allProjects = data.projects?.nodes || [];
      
      // Sort by status priority: In Progress, Todo (planned), Done, Canceled
      allProjects.sort((a, b) => {
        const statusOrder = {
          // In Progress variants
          'started': 0,
          'in_progress': 0,
          'active': 0,
          
          // Todo/Planning variants  
          'planned': 1,
          'backlog': 1,
          'todo': 1,
          'planning': 1,
          
          // Done/Completed variants
          'completed': 2,
          'done': 2,
          'finished': 2,
          
          // Canceled variants
          'canceled': 3,
          'cancelled': 3,
          'paused': 3
        };
        
        const aOrder = statusOrder[a.state?.toLowerCase?.()] ?? statusOrder[a.state] ?? 4;
        const bOrder = statusOrder[b.state?.toLowerCase?.()] ?? statusOrder[b.state] ?? 4;
        
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        
        // If same status, sort by creation date (newest first)
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      setProjects(allProjects);
    } catch (error) {
      setError('Failed to load projects. Please check your connection and try again.');
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleProjectClick = (project) => {
    navigate(`/project/${project.id}`);
  };

  const handleStatusChange = async (projectId, newStatus) => {
    try {
      await linearApi.updateProject(projectId, { state: newStatus });
      
      // Update project locally instead of full reload
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === projectId 
            ? { ...project, state: newStatus }
            : project
        )
      );
      
      setSelectedProject(null);
    } catch (error) {
      console.error('Failed to update project status:', error);
    }
  };

  const handleProjectLongPress = (project, event) => {
    setSelectedProject(project);
  };

  const handleRefresh = () => {
    loadProjects(true);
  };

  const handleCreateProject = async (projectData) => {
    try {
      // Get teams to find a team ID
      const teamsData = await linearApi.getTeams();
      const teamId = teamsData.teams?.nodes?.[0]?.id;
      
      if (!teamId) {
        alert('No team found. Please make sure you have at least one team in Linear.');
        setShowProjectForm(false);
        return;
      }

      await linearApi.createProject({
        name: projectData.name,
        teamIds: [teamId],
        description: projectData.description || ''
      });
      
      setShowProjectForm(false);
      await loadProjects(); // Refresh to show new project
    } catch (error) {
      console.error('Project creation failed:', error);
      setShowProjectForm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="projects-page">
        <div className="page-header">
          <div className="container">
            <h1 className="page-title">Projects</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="container">
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading projects...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeProjects = projects.filter(p => p.state !== 'completed' && p.state !== 'canceled');

  return (
    <div className="projects-page">
      <div className="page-header">
        <div className="container">
          <div className="header-content">
            <div>
              <h1 className="page-title">Projects</h1>
              <p className="page-subtitle">{activeProjects.length} active projects</p>
            </div>
            <button
              className="btn btn-icon btn-secondary refresh-btn"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw size={20} className={isRefreshing ? 'spinning' : ''} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="page-content">
        <div className="container">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {projects.length === 0 && !error ? (
            <div className="empty-state">
              <h3>No projects found</h3>
              <p>You don't have any projects yet. Create your first project in Linear to get started.</p>
            </div>
          ) : (
            <div className="projects-list">
              {projects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={handleProjectClick}
                  onStatusChange={handleStatusChange}
                  onLongPress={handleProjectLongPress}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <button 
        className="fab create-project-fab"
        onClick={() => setShowProjectForm(true)}
        title="Create New Project"
      >
        <Plus size={24} />
      </button>

      {showProjectForm && (
        <ProjectForm
          onSubmit={handleCreateProject}
          onCancel={() => setShowProjectForm(false)}
        />
      )}

      {selectedProject && (
        <ProjectStatusMenu
          project={selectedProject}
          onStatusChange={handleStatusChange}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}

export default ProjectsPage;