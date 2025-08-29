import { Clock, Home, CheckSquare, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import './BottomNav.css';

function BottomNav() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: Clock, label: 'Now' },
    { path: '/projects', icon: Home, label: 'Projects' },
    { path: '/todos', icon: CheckSquare, label: 'All Tasks' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map(({ path, icon: Icon, label }) => (
        <Link
          key={path}
          to={path}
          className={`nav-item ${location.pathname === path ? 'active' : ''}`}
        >
          <Icon size={28} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

export default BottomNav;