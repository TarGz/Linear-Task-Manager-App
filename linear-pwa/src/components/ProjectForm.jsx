import { useState } from 'react';
import { X, Save, Briefcase, Home } from 'lucide-react';
import './ProjectForm.css';

function ProjectForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planned',
    type: 'personal' // 'work' or 'personal'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    console.log('💫 Form submitting data:', formData);
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="project-form-overlay">
      <div className="project-form-modal card">
        <div className="project-form-header">
          <h3>Create New Project</h3>
          <button 
            type="button" 
            className="btn btn-icon btn-secondary"
            onClick={onCancel}
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="project-form">
          <div className="form-group">
            <label htmlFor="name">Project Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter project name"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Project description (optional)"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Project Type</label>
            <div className="type-selector">
              <button
                type="button"
                className={`type-button ${formData.type === 'personal' ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, type: 'personal' }))}
              >
                <Home size={16} />
                Personal
              </button>
              <button
                type="button"
                className={`type-button ${formData.type === 'work' ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, type: 'work' }))}
              >
                <Briefcase size={16} />
                Work
              </button>
            </div>
          </div>

          <div className="project-form-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!formData.name.trim()}
            >
              <Save size={16} />
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectForm;