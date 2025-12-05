import BurgerMenuButton from '../BurgerMenuButton';
import './PageHeader.css';

/**
 * Unified PageHeader component
 * Two layouts:
 * - List pages: [Burger Menu] [Title] --- [Actions]
 * - Detail pages (with backButton): [Back] [Title] --- [Actions]
 *                                   [Subtitle/metadata below]
 */
function PageHeader({
  title,
  actions,
  subtitle,
  backButton,
  onOpenBurgerMenu
}) {
  const isDetailPage = !!backButton;

  return (
    <div className={`page-header ${isDetailPage ? 'page-header--detail' : ''}`}>
      <div className="header-content">
        {/* Show burger OR back button, not both */}
        {backButton ? (
          <div className="header-back">
            {backButton}
          </div>
        ) : (
          onOpenBurgerMenu && <BurgerMenuButton onClick={onOpenBurgerMenu} />
        )}

        <h1 className="page-title">
          {title}
        </h1>

        <div className="header-spacer" />

        {actions && (
          <div className="header-actions">
            {actions}
          </div>
        )}
      </div>

      {/* Subtitle/metadata on second line for detail pages */}
      {subtitle && (
        <div className="header-meta">
          {subtitle}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
