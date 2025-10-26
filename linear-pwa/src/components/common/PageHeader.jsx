import BurgerMenuButton from '../BurgerMenuButton';
import './PageHeader.css';

/**
 * Unified PageHeader component
 * Layout: [Burger Menu (left)] [Back Button (if present)] [Title (left-aligned)] [Actions (right-aligned)]
 * - No icons in title (removed for consistency)
 * - Burger menu always on the left
 * - Title is left-aligned after burger/back button
 * - Actions always on the right
 */
function PageHeader({
  title,
  actions,
  subtitle,
  backButton,
  onOpenBurgerMenu
}) {
  return (
    <div className="page-header">
      <div className="header-content">
        {onOpenBurgerMenu && <BurgerMenuButton onClick={onOpenBurgerMenu} />}

        {backButton && (
          <div className="header-back">
            {backButton}
          </div>
        )}

        <div className="header-main">
          <h1 className="page-title">
            {title}
          </h1>
          {subtitle && (
            <p className="page-subtitle">{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className="header-actions">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export default PageHeader;