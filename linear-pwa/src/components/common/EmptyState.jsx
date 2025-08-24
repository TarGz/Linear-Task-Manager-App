import './EmptyState.css';

function EmptyState({ 
  title, 
  description, 
  icon: Icon, 
  action, 
  size = "default" 
}) {
  return (
    <div className={`empty-state ${size}`}>
      {Icon && (
        <div className="empty-state-icon">
          <Icon size={size === "small" ? 32 : 48} />
        </div>
      )}
      <h3 className="empty-state-title">{title}</h3>
      {description && (
        <p className="empty-state-description">{description}</p>
      )}
      {action && (
        <div className="empty-state-action">
          {action}
        </div>
      )}
    </div>
  );
}

export default EmptyState;