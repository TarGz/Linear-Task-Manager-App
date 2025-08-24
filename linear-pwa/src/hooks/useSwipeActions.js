import { useState, useRef, useCallback } from 'react';

const SWIPE_THRESHOLD = 60; // Minimum distance to trigger action
const MAX_SWIPE_DISTANCE = 120; // Maximum swipe distance (2/3 of screen concept)

export const useSwipeActions = ({ 
  onSwipeLeft, 
  onSwipeRight, 
  onLongPress,
  longPressDelay = 500 
}) => {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null); // 'left' | 'right' | null
  const [isFixed, setIsFixed] = useState(false); // Whether card is in fixed position
  const [longPressTimer, setLongPressTimer] = useState(null);
  
  const elementRef = useRef(null);

  const resetCard = useCallback(() => {
    if (elementRef.current) {
      elementRef.current.style.transition = 'transform 0.2s ease-out';
      elementRef.current.style.transform = '';
      elementRef.current.removeAttribute('data-swipe-progress');
    }
    
    setIsFixed(false);
    setSwipeDirection(null);
    setIsDragging(false);
    setStartX(0);
    setCurrentX(0);
    setIsLongPress(false);
  }, []);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    
    // If card is fixed, we're starting a reset swipe
    if (isFixed) {
      setStartX(touch.clientX);
      setCurrentX(touch.clientX);
      setIsDragging(true);
      return;
    }

    setStartX(touch.clientX);
    setCurrentX(touch.clientX);
    setIsDragging(true);
    setIsLongPress(false);
    setSwipeDirection(null);
    
    // Start long press timer
    if (onLongPress) {
      const timer = setTimeout(() => {
        setIsLongPress(true);
        onLongPress(e);
      }, longPressDelay);
      setLongPressTimer(timer);
    }
  }, [isFixed, onLongPress, longPressDelay]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const currentPosition = touch.clientX;
    const diff = currentPosition - startX;
    
    // Clear long press timer on move
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    setCurrentX(currentPosition);
    
    // If card is fixed, handle reset swipe
    if (isFixed) {
      const resetThreshold = 30; // How far to swipe to reset
      
      if ((swipeDirection === 'left' && diff > resetThreshold) || 
          (swipeDirection === 'right' && diff < -resetThreshold)) {
        resetCard();
      }
      return;
    }
    
    // Determine swipe direction and limit distance
    let transform = 0;
    let direction = null;
    
    if (Math.abs(diff) > 10) { // Minimum movement to start swiping
      if (diff < 0) { // Finger moving right to left
        direction = 'left';
        transform = Math.max(diff, -MAX_SWIPE_DISTANCE); // Card moves left with finger
      } else { // Finger moving left to right
        direction = 'right';
        transform = Math.min(diff, MAX_SWIPE_DISTANCE); // Card moves right with finger
      }
      
      setSwipeDirection(direction);
      
      // Apply transform to the element
      if (elementRef.current) {
        elementRef.current.style.transform = `translateX(${transform}px)`;
        elementRef.current.style.transition = 'none';
        
        // Add visual feedback based on swipe distance
        const opacity = Math.min(Math.abs(transform) / SWIPE_THRESHOLD, 1);
        elementRef.current.setAttribute('data-swipe-progress', opacity);
      }
    }
  }, [isDragging, startX, longPressTimer, isFixed, swipeDirection, resetCard]);

  const handleTouchEnd = useCallback(() => {
    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    const diff = currentX - startX;
    const absDiff = Math.abs(diff);
    
    // If threshold is met and not a long press, fix the card in position
    if (!isLongPress && absDiff >= SWIPE_THRESHOLD) {
      const direction = diff < 0 ? 'left' : 'right';
      const fixedTransform = diff < 0 ? -MAX_SWIPE_DISTANCE : MAX_SWIPE_DISTANCE;
      
      if (elementRef.current) {
        elementRef.current.style.transition = 'transform 0.2s ease-out';
        elementRef.current.style.transform = `translateX(${fixedTransform}px)`;
        elementRef.current.setAttribute('data-swipe-progress', '1');
      }
      
      setIsFixed(true);
      setSwipeDirection(direction);
      setIsDragging(false);
    } else {
      // Reset if threshold not met
      resetCard();
    }
  }, [currentX, startX, isLongPress, resetCard]);

  const handleMouseDown = useCallback((e) => {
    const clientX = e.clientX;
    setStartX(clientX);
    setCurrentX(clientX);
    setIsDragging(true);
    setIsLongPress(false);
    setSwipeDirection(null);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    handleTouchMove({ touches: [{ clientX: e.clientX }] });
  }, [isDragging, handleTouchMove]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    handleTouchEnd();
  }, [isDragging, handleTouchEnd]);

  return {
    elementRef,
    swipeDirection,
    isDragging,
    isLongPress,
    isFixed,
    resetCard,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
    }
  };
};