import { 
  Package, Briefcase, Code2, Palette, Target, Zap, 
  Database, Globe, Smartphone, Settings, Users, 
  BookOpen, Lightbulb, Rocket, Shield, Heart,
  Music, Camera, Coffee, Gamepad2, Trophy
} from 'lucide-react';

// Available icons for projects
export const availableIcons = {
  'package': Package,
  'briefcase': Briefcase,
  'code2': Code2,
  'palette': Palette,
  'target': Target,
  'zap': Zap,
  'database': Database,
  'globe': Globe,
  'smartphone': Smartphone,
  'settings': Settings,
  'users': Users,
  'book-open': BookOpen,
  'lightbulb': Lightbulb,
  'rocket': Rocket,
  'shield': Shield,
  'heart': Heart,
  'music': Music,
  'camera': Camera,
  'coffee': Coffee,
  'gamepad2': Gamepad2,
  'trophy': Trophy
};

// Get saved icon for a project
export const getProjectIcon = (projectId, projectName, iconKey = null) => {
  const savedIcons = JSON.parse(localStorage.getItem('projectIcons') || '{}');
  const savedIconKey = iconKey || savedIcons[projectId];
  
  if (savedIconKey && availableIcons[savedIconKey]) {
    return availableIcons[savedIconKey];
  }
  
  // Smart defaults based on project name
  if (projectName) {
    const lowercaseName = projectName.toLowerCase();
    
    if (lowercaseName.includes('web') || lowercaseName.includes('frontend') || lowercaseName.includes('website')) {
      return availableIcons['globe'];
    }
    if (lowercaseName.includes('mobile') || lowercaseName.includes('app') || lowercaseName.includes('ios') || lowercaseName.includes('android')) {
      return availableIcons['smartphone'];
    }
    if (lowercaseName.includes('api') || lowercaseName.includes('backend') || lowercaseName.includes('server')) {
      return availableIcons['database'];
    }
    if (lowercaseName.includes('design') || lowercaseName.includes('ui') || lowercaseName.includes('ux')) {
      return availableIcons['palette'];
    }
    if (lowercaseName.includes('security') || lowercaseName.includes('auth')) {
      return availableIcons['shield'];
    }
    if (lowercaseName.includes('game') || lowercaseName.includes('gaming')) {
      return availableIcons['gamepad2'];
    }
    if (lowercaseName.includes('music') || lowercaseName.includes('audio')) {
      return availableIcons['music'];
    }
    if (lowercaseName.includes('photo') || lowercaseName.includes('image') || lowercaseName.includes('media')) {
      return availableIcons['camera'];
    }
    if (lowercaseName.includes('team') || lowercaseName.includes('user')) {
      return availableIcons['users'];
    }
    if (lowercaseName.includes('docs') || lowercaseName.includes('documentation') || lowercaseName.includes('wiki')) {
      return availableIcons['book-open'];
    }
    if (lowercaseName.includes('config') || lowercaseName.includes('setup') || lowercaseName.includes('setting')) {
      return availableIcons['settings'];
    }
    if (lowercaseName.includes('launch') || lowercaseName.includes('deploy') || lowercaseName.includes('release')) {
      return availableIcons['rocket'];
    }
  }
  
  // Default fallback
  return availableIcons['package'];
};

// Save icon selection for a project
export const saveProjectIcon = (projectId, iconKey) => {
  const savedIcons = JSON.parse(localStorage.getItem('projectIcons') || '{}');
  savedIcons[projectId] = iconKey;
  localStorage.setItem('projectIcons', JSON.stringify(savedIcons));
  
  // Broadcast the change
  window.dispatchEvent(new CustomEvent('projectIconChanged', { 
    detail: { projectId, iconKey } 
  }));
};

// Map Linear's icon name identifiers to emoji glyphs for display
const LINEAR_ICON_TO_EMOJI = {
  package: '📦',
  briefcase: '💼',
  target: '🎯',
  lightbulb: '💡',
  zap: '⚡️',
  rocket: '🚀',
  star: '⭐️',
  heart: '❤️',
  coffee: '☕️',
  camera: '📸',
  music: '🎵',
  book: '📚',
  code: '💻',
  palette: '🎨',
  globe: '🌐',
  shield: '🛡️',
  wrench: '🛠️',
  monitor: '🖥️',
  smartphone: '📱',
  megaphone: '📣',
  checksquare: '✅',
  check: '✅',
  bug: '🐞',
  database: '🗄️',
  server: '🖧',
  cloud: '☁️',
  folder: '📁',
  file: '📄',
  key: '🔑',
  lock: '🔒',
  flag: '🚩',
  calendar: '📅',
  chart: '📊'
};

// Convert a Linear icon name to an emoji; return null if unknown
export const linearIconNameToEmoji = (name) => {
  if (!name || typeof name !== 'string') return null;
  const key = name.trim().toLowerCase();
  return LINEAR_ICON_TO_EMOJI[key] || null;
};
