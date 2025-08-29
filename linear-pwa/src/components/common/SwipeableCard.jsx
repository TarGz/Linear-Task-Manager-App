import { Play, Check } from 'lucide-react';
import { useSwipeActions } from '../../hooks/useSwipeActions';
import './SwipeableCard.css';

function SwipeableCard({
  children,
  onSwipeActionLeft,  // Action when swiping right (e.g., Mark In Progress)
  onSwipeActionRight, // Action when swiping left (e.g., Mark Complete)
  onLongPress,
  disabled = false,
  leftActionLabel = "Action",
  rightActionLabel = "Done",
  className = ""
}) {

  const { elementRef, swipeDirection, isActionReady, handlers, resetCard } = useSwipeActions({
    onSwipeLeft: onSwipeActionRight,  // Finger moving right to left
    onSwipeRight: onSwipeActionLeft,   // Finger moving left to right
    onLongPress
  });

  const handleRightActionClick = () => {
    if (onSwipeActionRight) {
      onSwipeActionRight();
    }
    if (resetCard) {
      resetCard();
    }
  };

  const handleLeftActionClick = () => {
    if (onSwipeActionLeft) {
      onSwipeActionLeft();
    }
    if (resetCard) {
      resetCard();
    }
  };

  return (
    <div className={`swipeable-card-container ${className}`}>
      {/* Left action - appears when card moves RIGHT */}
      <div className={`swipe-action swipe-action-left ${swipeDirection === 'right' ? 'visible' : ''}`}>
        <div className="swipe-action-content" onClick={handleLeftActionClick}>
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
        <div className="swipe-action-content" onClick={handleRightActionClick}>
          <Check size={20} />
        </div>
      </div>
    </div>
  );
}

export default SwipeableCard;