import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProjectCard from '../components/ProjectCard';
import ProjectStatusMenu from '../components/ProjectStatusMenu';
import linearApi from '../services/linearApi';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();
  const [inProgressProjects, setInProgressProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);


  const loadProjects = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const data = await linearApi.getProjects();
      const allProjectsList = data.projects?.nodes || [];
      
      // Sort by status priority: In Progress, Todo (planned), Done, Canceled
      allProjectsList.sort((a, b) => {
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
      
      setAllProjects(allProjectsList);
      
      // Filter in progress projects
      const inProgressProjectsList = allProjectsList.filter(project => 
        project.state === 'started' || project.state === 'progress'
      );
      setInProgressProjects(inProgressProjectsList);
    } catch (error) {
      setError('Failed to load projects. Please check your connection and try again.');
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Update in progress projects when allProjects change
  useEffect(() => {
    const inProgressProjectsList = allProjects.filter(project => 
      project.state === 'started' || project.state === 'progress'
    );
    setInProgressProjects(inProgressProjectsList);
  }, [allProjects]);

  const handleProjectClick = (project) => {
    navigate(`/project/${project.id}`);
  };

  const handleStatusChange = async (projectId, newStatus) => {
    try {
      await linearApi.updateProject(projectId, { state: newStatus });
      
      // Update projects locally
      const updateProject = (project) => 
        project.id === projectId ? { ...project, state: newStatus } : project;
      
      setAllProjects(prev => prev.map(updateProject));
      
      setSelectedProject(null);
    } catch (error) {
      console.error('Failed to update project status:', error);
    }
  };

  const handleProjectLongPress = (project, event) => {
    setSelectedProject(project);
  };



  if (isLoading) {
    return (
      <div className="home-page">
        <div className="page-header">
          <div className="container">
            <h1 className="page-title">In Progress</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="container">
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading in progress projects...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="page-header">
        <div className="container">
          <div className="header-content">
            <div className="header-info">
              <h1 className="page-title">
                <Activity size={24} className="page-icon" />
                In Progress
              </h1>
              <p className="page-subtitle">
                {inProgressProjects.length} active {inProgressProjects.length === 1 ? 'project' : 'projects'}
              </p>
            </div>
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

          {inProgressProjects.length === 0 && !error ? (
            <div className="empty-state">
              <Activity size={48} className="empty-state-icon" />
              <h3>No projects in progress</h3>
              <p>This is your In Progress page. To see ALL your projects, click "Projects" in the bottom navigation. Projects with "In Progress" or "Started" status will appear here.</p>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/projects')}
              >
                Go to All Projects
              </button>
            </div>
          ) : (
            <div className="projects-list">
              {inProgressProjects.map(project => (
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

export default HomePage;