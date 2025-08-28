import { Play, Check } from 'lucide-react';
import { useSwipeActions } from '../../hooks/useSwipeActions';
import './SwipeableCard.css';

function SwipeableCard({
  children,
  onDelete,
  onMarkDone,
  onLongPress,
  disabled = false,
  deleteLabel = "Delete",
  markDoneLabel = "Done",
  className = ""
}) {
  const { elementRef, swipeDirection, handlers, resetCard } = useSwipeActions({
    onSwipeLeft: onMarkDone, // Finger moving right to left shows mark done
    onSwipeRight: onDelete,  // Finger moving left to right shows delete
    onLongPress
  });

  const handleMarkDoneClick = () => {
    if (onMarkDone) {
      onMarkDone();
    }
    if (resetCard) {
      resetCard();
    }
  };

  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete();
    }
    if (resetCard) {
      resetCard();
    }
  };

  return (
    <div className={`swipeable-card-container ${className}`}>
      {/* Left action - appears when card moves RIGHT */}
      <div className={`swipe-action swipe-action-left ${swipeDirection === 'right' ? 'visible' : ''}`}>
        <div className="swipe-action-content" onClick={handleDeleteClick}>
          <Play size={20} />
        </div>
      </div>

      {/* Main card content */}
      <div
        ref={elementRef}
        className={`swipeable-card ${disabled ? 'disabled' : ''}`}
        {...handlers}
      >
        {children}
      </div>

      {/* Right action - appears when card moves LEFT */}
      <div className={`swipe-action swipe-action-right ${swipeDirection === 'left' ? 'visible' : ''}`}>
        <div className="swipe-action-content" onClick={handleMarkDoneClick}>
          <Check size={20} />
        </div>
      </div>
    </div>
  );
}

export default SwipeableCard;