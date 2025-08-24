import './PageHeader.css';

function PageHeader({ 
  title, 
  icon: Icon, 
  actions, 
  subtitle,
  backButton 
}) {
  return (
    <div className="page-header">
      <div className="container">
        <div className="header-content">
          {backButton && (
            <div className="header-back">
              {backButton}
            </div>
          )}
          
          <div className="header-main">
            <h1 className="page-title">
              {Icon && <Icon size={24} className="page-icon" />}
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
    </div>
  );
}

export default PageHeader;