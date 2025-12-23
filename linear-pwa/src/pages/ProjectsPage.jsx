import { useState, useEffect } from 'react';
import { FolderPlus, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import ProjectCard from '../components/ProjectCard';
import ProjectForm from '../components/ProjectForm';
import ProjectStatusMenu from '../components/ProjectStatusMenu';
import ConfirmationPanel from '../components/common/ConfirmationPanel';
import linearApi from '../services/linearApi';
import './ProjectsPage.css';

function ProjectsPage({ onOpenBurgerMenu }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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
      // Get all teams to find the correct team based on project type
      const teamsData = await linearApi.getTeams();
      const allTeams = teamsData.teams?.nodes || [];

      if (allTeams.length === 0) {
        alert('No team found. Please make sure you have at least one team in Linear.');
        setShowProjectForm(false);
        return;
      }

      // Store team type in project name and get appropriate label if needed
      console.log('🔍 Full projectData received:', projectData);
      console.log('🔍 projectData.type:', projectData.type);
      console.log('🔍 Available teams:', allTeams.map(t => t.name));

      let projectName = projectData.name;
      let labelIds = [];
      let teamId;

      if (projectData.type === 'pro') {
        // Find the Pro team (case insensitive)
        const proTeam = allTeams.find(t => t.name?.toLowerCase() === 'pro' || t.name?.toLowerCase() === 'professional');
        if (!proTeam) {
          alert('Pro team not found. Please create a "Pro" team in Linear first.');
          setShowProjectForm(false);
          return;
        }
        teamId = proTeam.id;
        projectName = `🏢 ${projectData.name}`;
        console.log('✅ Creating PRO project with name:', projectName, 'in team:', proTeam.name);

        // Get Work PROJECT label ID for pro projects
        console.log('🏷️ Getting Work project label...');
        const workLabel = await linearApi.ensureWorkProjectLabel();
        console.log('🏷️ Retrieved Work project label:', workLabel);

        if (workLabel?.id) {
          labelIds = [workLabel.id];
          console.log('✅ Will create project with Work PROJECT label ID:', workLabel.id);
        } else {
          console.log('❌ Could not get Work PROJECT label ID');
        }
      } else {
        // Find the Targz team (case insensitive)
        const targzTeam = allTeams.find(t => t.name?.toLowerCase() === 'targz');
        if (!targzTeam) {
          alert('Targz team not found. Please create a "Targz" team in Linear first.');
          setShowProjectForm(false);
          return;
        }
        teamId = targzTeam.id;
        console.log('✅ Creating TARGZ project with name:', projectName, 'in team:', targzTeam.name);
      }

      const createData = {
        name: projectName,
        teamIds: [teamId],
        description: projectData.description || '',
        ...(labelIds.length > 0 && { labelIds })
      };

      console.log('Creating project with data:', createData);
      console.log('🏷️ Project label IDs being applied:', labelIds);
      console.log('🏷️ Team ID being used:', teamId);

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
        <PageHeader
          title="Projects"
          onOpenBurgerMenu={onOpenBurgerMenu}
        />
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

  // Filter projects based on search query
  const filteredProjects = projects.filter(project =>
    project.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="projects-page">
      <PageHeader
        title="Projects"
        onOpenBurgerMenu={onOpenBurgerMenu}
        actions={
          <button
            className="filter-button-compact"
            onClick={() => setShowProjectForm(true)}
            title="Create new project"
            aria-label="Create new project"
          >
            <FolderPlus size={16} />
          </button>
        }
      />
      
      <div className="page-content">
        <div className="container">
          {/* Search Bar */}
          <div className="projects-search-container">
            <div className="projects-search-bar">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="projects-search-input"
              />
              {searchQuery && (
                <button
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

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
          ) : filteredProjects.length === 0 ? (
            <div className="empty-state">
              <h3>No matching projects</h3>
              <p>No projects match "{searchQuery}"</p>
            </div>
          ) : (
            <div className="projects-list">
              {filteredProjects.map(project => (
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
