import { Package, Briefcase, Target, Lightbulb, Zap, Rocket, Star, Heart, Coffee, Camera, Music, Book, Code, Palette, Globe, Shield, Wrench, Monitor, Smartphone, Megaphone, CheckSquare } from 'lucide-react';
// Note: Linear API restricts project icon values; changing it here is disabled
// and should be done in Linear. We still show the current Linear icon.
import './IconSelector.css';

import { linearIconNameToEmoji } from '../utils/iconUtils';

function IconSelector({ projectId, currentIcon, onClose, onLinearIconChange, linearIcon, onOpenInLinear }) {
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

  // Linear icon selection is read-only for now; open in Linear to change

  return (
    <div className="icon-selector-overlay" onClick={onClose}>
      <div className="icon-selector card" onClick={(e) => e.stopPropagation()}>
        <div className="icon-selector-header">
          <h4>Choose Project Icon</h4>
        </div>

        <div className="icon-sections">
          <div className="section-title">Linear Icon (read-only)</div>
          <div className="icon-grid">
            <div className="icon-option" style={{ cursor: 'default' }} title="Current Linear icon">
              <span style={{ fontSize: 24, lineHeight: 1 }} aria-hidden="true">{linearIconNameToEmoji(linearIcon) || linearIcon || '—'}</span>
            </div>
            <button className="icon-option" onClick={onOpenInLinear} title="Edit in Linear">
              <span style={{ fontSize: 14 }}>Edit in Linear</span>
            </button>
          </div>

          <div className="section-title">Local Icon (app only)</div>
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
    </div>
  );
}

export default IconSelector;
