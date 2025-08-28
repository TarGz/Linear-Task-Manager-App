import { useState, useRef, useCallback } from 'react';

const SWIPE_THRESHOLD = 60; // Minimum distance to trigger action
const MAX_SWIPE_DISTANCE = 100; // Maximum swipe distance (matches button width)
const MIN_MOVEMENT = 10; // Minimum movement to start swiping

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
  const [isActionReady, setIsActionReady] = useState(false); // Whether action is ready to trigger
  const [longPressTimer, setLongPressTimer] = useState(null);
  
  const elementRef = useRef(null);

  // Haptic feedback helper
  const triggerHaptic = useCallback((type = 'light') => {
    if (navigator.vibrate) {
      const patterns = {
        light: 10,
        medium: 20,
        heavy: 50
      };
      navigator.vibrate(patterns[type] || patterns.light);
    }
  }, []);

  const resetCard = useCallback((skipAnimation = false) => {
    if (elementRef.current) {
      if (!skipAnimation) {
        elementRef.current.style.transition = 'transform 0.2s ease-out';
        elementRef.current.style.transform = '';
      }
      elementRef.current.removeAttribute('data-swipe-progress');
      elementRef.current.removeAttribute('data-action-ready');
    }
    
    setSwipeDirection(null);
    setIsDragging(false);
    setIsActionReady(false);
    setStartX(0);
    setCurrentX(0);
    setIsLongPress(false);
  }, []);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];

    setStartX(touch.clientX);
    setCurrentX(touch.clientX);
    setIsDragging(true);
    setIsLongPress(false);
    setSwipeDirection(null);
    setIsActionReady(false);
    
    // Start long press timer
    if (onLongPress) {
      const timer = setTimeout(() => {
        setIsLongPress(true);
        onLongPress(e);
      }, longPressDelay);
      setLongPressTimer(timer);
    }
  }, [onLongPress, longPressDelay]);

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
    
    // Determine swipe direction and limit distance
    let transform = 0;
    let direction = null;
    let actionReady = false;
    
    if (Math.abs(diff) > MIN_MOVEMENT) { // Minimum movement to start swiping
      if (diff < 0) { // Finger moving right to left
        direction = 'left';
        transform = Math.max(diff, -MAX_SWIPE_DISTANCE); // Card moves left with finger
      } else { // Finger moving left to right
        direction = 'right';
        transform = Math.min(diff, MAX_SWIPE_DISTANCE); // Card moves right with finger
      }
      
      // Check if action is ready (button fully visible and colored)
      const absTransform = Math.abs(transform);
      actionReady = absTransform >= SWIPE_THRESHOLD;
      
      // Trigger haptic feedback when transitioning to action-ready state
      if (actionReady && !isActionReady) {
        triggerHaptic('medium');
      }
      
      setSwipeDirection(direction);
      setIsActionReady(actionReady);
      
      // Apply transform to the element
      if (elementRef.current) {
        elementRef.current.style.transform = `translateX(${transform}px)`;
        elementRef.current.style.transition = 'none';
        
        // Add visual feedback based on swipe distance
        const progress = Math.min(absTransform / SWIPE_THRESHOLD, 1);
        elementRef.current.setAttribute('data-swipe-progress', progress.toString());
        elementRef.current.setAttribute('data-action-ready', actionReady.toString());
      }
    }
  }, [isDragging, startX, longPressTimer, isActionReady, triggerHaptic]);

  const handleTouchEnd = useCallback(() => {
    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    // If action is ready and not a long press, trigger the action
    if (!isLongPress && isActionReady && swipeDirection) {
      // Trigger haptic feedback for action execution
      triggerHaptic('heavy');
      
      // Execute the appropriate action
      if (swipeDirection === 'left' && onSwipeLeft) {
        onSwipeLeft(swipeDirection);
      } else if (swipeDirection === 'right' && onSwipeRight) {
        onSwipeRight(swipeDirection);
      }
      
      // Skip reset animation since we're triggering the action
      resetCard(true);
    } else {
      // Immediate reset animation if action not ready
      if (elementRef.current) {
        elementRef.current.style.transition = 'transform 0.2s ease-out';
        elementRef.current.style.transform = '';
      }
      resetCard();
    }
  }, [isLongPress, isActionReady, swipeDirection, onSwipeLeft, onSwipeRight, triggerHaptic, resetCard]);

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
    isActionReady,
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