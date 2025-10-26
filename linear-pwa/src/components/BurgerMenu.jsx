import { Clock, Home, CheckSquare, Settings, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import './BurgerMenu.css';

function BurgerMenu({ isOpen, onClose }) {
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  const navItems = [
    { path: '/', icon: Clock, label: 'Now' },
    { path: '/projects', icon: Home, label: 'Projects' },
    { path: '/todos', icon: CheckSquare, label: 'All Tasks' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  // Close menu on route change (but not on initial mount)
  useEffect(() => {
    if (prevPathRef.current !== location.pathname && isOpen) {
      onClose();
    }
    prevPathRef.current = location.pathname;
  }, [location.pathname, isOpen, onClose]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`burger-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      {/* Menu */}
      <nav className={`burger-menu ${isOpen ? 'open' : ''}`}>
        <div className="burger-header">
          <h2>Menu</h2>
          <button
            className="burger-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <div className="burger-nav-items">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`burger-nav-item ${location.pathname === path ? 'active' : ''}`}
            >
              <Icon size={24} />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}

export default BurgerMenu;
