import { useState, useEffect } from 'react';
import { Plus, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProjectCard from '../components/ProjectCard';
import ProjectForm from '../components/ProjectForm';
import ProjectStatusMenu from '../components/ProjectStatusMenu';
import ConfirmationPanel from '../components/common/ConfirmationPanel';
import linearApi from '../services/linearApi';
import './ProjectsPage.css';

function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
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

  const handleProjectDelete = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    setDeleteConfirmation({
      projectId,
      title: 'Delete Project',
      message: `Are you sure you want to delete "${project?.name}"? This action cannot be undone.`
    });
  };

  const confirmProjectDelete = async () => {
    if (!deleteConfirmation) return;
    
    try {
      const result = await linearApi.deleteProject(deleteConfirmation.projectId);
      
      if (result.projectDelete?.success) {
        // Remove project from local state
        setProjects(prev => prev.filter(p => p.id !== deleteConfirmation.projectId));
      } else {
        setError('Failed to delete project. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      setError('Failed to delete project. Please try again.');
    } finally {
      setDeleteConfirmation(null);
    }
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

      // Store work type in project name and get Work label if needed
      console.log('🔍 Full projectData received:', projectData);
      console.log('🔍 projectData.type:', projectData.type);
      console.log('🔍 projectData.type === "work":', projectData.type === 'work');
      
      let projectName = projectData.name;
      let labelIds = [];
      
      if (projectData.type === 'work') {
        projectName = `🏢 ${projectData.name}`;
        console.log('✅ Creating WORK project with name:', projectName);
        
        // Get Work label ID for work projects
        console.log('🏷️ Getting Work label for project...');
        const workLabel = await linearApi.ensureWorkLabel();
        console.log('🏷️ Retrieved Work label for project:', workLabel);
        
        if (workLabel?.id) {
          labelIds = [workLabel.id];
          console.log('✅ Will create project with Work label ID:', workLabel.id);
        } else {
          console.log('❌ Could not get Work label ID for project');
        }
      } else {
        console.log('❌ Not a work project, type is:', projectData.type);
      }

      const createData = {
        name: projectName,
        teamIds: [teamId],
        description: projectData.description || '',
        ...(labelIds.length > 0 && { labelIds })
      };
      
      console.log('Creating project with data:', createData);
      console.log('🏷️ Project label IDs being applied:', labelIds);
      
      const result = await linearApi.createProject(createData);
      console.log('✅ Project creation result:', result);
      
      setShowProjectForm(false);
      await loadProjects(); // Refresh to show new project
    } catch (error) {
      console.error('❌ Project creation failed:', error);
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
            <h1 className="page-title">
              <Home size={24} className="page-icon" />
              Projects
            </h1>
            <button 
              className="btn btn-primary create-project-header-btn"
              onClick={() => setShowProjectForm(true)}
              title="Create New Project"
            >
              <Plus size={20} />
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
                  onDelete={handleProjectDelete}
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

      <ConfirmationPanel
        isVisible={!!deleteConfirmation}
        title={deleteConfirmation?.title || ''}
        message={deleteConfirmation?.message || ''}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmProjectDelete}
        onCancel={() => setDeleteConfirmation(null)}
        type="danger"
      />
    </div>
  );
}

export default ProjectsPage;