import { Menu } from 'lucide-react';
import './BurgerMenuButton.css';

function BurgerMenuButton({ onClick }) {
  return (
    <button
      className="burger-menu-button-inline"
      onClick={onClick}
      aria-label="Open menu"
    >
      <Menu size={24} />
    </button>
  );
}

export default BurgerMenuButton;
