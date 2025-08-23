import { Package, Briefcase, Target, Lightbulb, Zap, Rocket, Star, Heart, Coffee, Camera, Music, Book, Code, Palette, Globe, Shield, Wrench, Monitor, Smartphone, Megaphone, CheckSquare } from 'lucide-react';
import './IconSelector.css';

function IconSelector({ projectId, currentIcon, onClose }) {
  const availableIcons = [
    { key: 'package', icon: Package, label: 'Package' },
    { key: 'briefcase', icon: Briefcase, label: 'Briefcase' },
    { key: 'target', icon: Target, label: 'Target' },
    { key: 'lightbulb', icon: Lightbulb, label: 'Idea' },
    { key: 'zap', icon: Zap, label: 'Energy' },
    { key: 'rocket', icon: Rocket, label: 'Rocket' },
    { key: 'star', icon: Star, label: 'Star' },
    { key: 'heart', icon: Heart, label: 'Heart' },
    { key: 'coffee', icon: Coffee, label: 'Coffee' },
    { key: 'camera', icon: Camera, label: 'Camera' },
    { key: 'music', icon: Music, label: 'Music' },
    { key: 'book', icon: Book, label: 'Book' },
    { key: 'code', icon: Code, label: 'Code' },
    { key: 'palette', icon: Palette, label: 'Design' },
    { key: 'globe', icon: Globe, label: 'Global' },
    { key: 'shield', icon: Shield, label: 'Security' },
    { key: 'wrench', icon: Wrench, label: 'Tools' },
    { key: 'monitor', icon: Monitor, label: 'Web' },
    { key: 'smartphone', icon: Smartphone, label: 'Mobile' },
    { key: 'megaphone', icon: Megaphone, label: 'Marketing' },
    { key: 'checksquare', icon: CheckSquare, label: 'Tasks' }
  ];

  const handleIconSelect = (iconKey) => {
    const savedIcons = JSON.parse(localStorage.getItem('projectIcons') || '{}');
    savedIcons[projectId] = iconKey;
    localStorage.setItem('projectIcons', JSON.stringify(savedIcons));
    
    // Trigger a custom event to update the project card
    window.dispatchEvent(new CustomEvent('projectIconChanged', { 
      detail: { projectId, iconKey } 
    }));
    
    onClose();
  };

  return (
    <div className="icon-selector-overlay" onClick={onClose}>
      <div className="icon-selector card" onClick={(e) => e.stopPropagation()}>
        <div className="icon-selector-header">
          <h4>Choose Project Icon</h4>
        </div>
        
        <div className="icon-grid">
          {availableIcons.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              className={`icon-option ${currentIcon === key ? 'selected' : ''}`}
              onClick={() => handleIconSelect(key)}
              title={label}
            >
              <Icon size={24} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default IconSelector;