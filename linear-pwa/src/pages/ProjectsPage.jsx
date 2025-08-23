import { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProjectCard from '../components/ProjectCard';
import linearApi from '../services/linearApi';
import './ProjectsPage.css';

function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadProjects = async (showRefreshSpinner = false) => {
    try {
      if (showRefreshSpinner) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError('');
      
      const data = await linearApi.getProjects();
      
      const allProjects = [];
      if (data.viewer?.teamMemberships?.nodes) {
        data.viewer.teamMemberships.nodes.forEach(membership => {
          const team = membership.team;
          if (team.projects?.nodes) {
            team.projects.nodes.forEach(project => {
              allProjects.push({
                ...project,
                teamName: team.name,
                teamId: team.id
              });
            });
          }
        });
      }
      
      allProjects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
      await loadProjects();
    } catch (error) {
      console.error('Failed to update project status:', error);
    }
  };

  const handleRefresh = () => {
    loadProjects(true);
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
                  tasks={project.issues?.nodes || []}
                  onClick={handleProjectClick}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <button className="fab" onClick={() => window.open('https://linear.app', '_blank')}>
        <Plus size={24} />
      </button>
    </div>
  );
}

export default ProjectsPage;