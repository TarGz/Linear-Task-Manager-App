import { useEffect, useCallback, useRef } from 'react';

export function useNotifications() {
  const notificationPermission = useRef(Notification.permission);
  const notifiedTasks = useRef(new Set());

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      notificationPermission.current = permission;
      return permission === "granted";
    }

    return Notification.permission === "granted";
  }, []);

  const showNotification = useCallback((title, options = {}) => {
    if (notificationPermission.current !== "granted") {
      return null;
    }

    const defaultOptions = {
      icon: "/Linear-Task-Manager-App/pwa-192x192.png",
      badge: "/Linear-Task-Manager-App/pwa-192x192.png",
      tag: "linear-task",
      requireInteraction: false,
      ...options
    };

    return new Notification(title, defaultOptions);
  }, []);

  const checkTasksDue = useCallback((tasks) => {
    if (!tasks || tasks.length === 0) return;
    
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    tasks.forEach(task => {
      if (!task.dueDate) return;
      
      const dueDate = new Date(task.dueDate);
      const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
      const notificationKey = `${task.id}_${task.dueDate}`;
      
      // Skip if already notified for this task
      if (notifiedTasks.current.has(notificationKey)) return;
      
      let shouldNotify = false;
      let title = "";
      let body = "";
      
      if (hoursUntilDue < 0) {
        // Overdue
        title = `🚨 Overdue: ${task.title}`;
        body = `Was due ${Math.abs(Math.round(hoursUntilDue / 24))} days ago`;
        shouldNotify = true;
      } else if (hoursUntilDue <= 1) {
        // Due within 1 hour
        title = `⏰ Due Soon: ${task.title}`;
        body = "Due in less than 1 hour!";
        shouldNotify = true;
      } else if (hoursUntilDue <= 24) {
        // Due today
        title = `📅 Due Today: ${task.title}`;
        body = `Due in ${Math.round(hoursUntilDue)} hours`;
        shouldNotify = true;
      } else if (hoursUntilDue <= 48) {
        // Due tomorrow
        title = `📆 Due Tomorrow: ${task.title}`;
        body = dueDate.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        });
        shouldNotify = true;
      }
      
      if (shouldNotify) {
        showNotification(title, {
          body,
          data: { 
            taskId: task.id,
            url: `/task/${task.id}`
          },
          silent: false
        });
        
        // Mark as notified
        notifiedTasks.current.add(notificationKey);
        
        // Store in localStorage to persist across sessions
        const stored = JSON.parse(localStorage.getItem('notifiedTasks') || '[]');
        stored.push({ key: notificationKey, time: now.toISOString() });
        // Keep only last 100 notifications
        if (stored.length > 100) {
          stored.splice(0, stored.length - 100);
        }
        localStorage.setItem('notifiedTasks', JSON.stringify(stored));
      }
    });
  }, [showNotification]);

  // Load previously notified tasks on mount
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('notifiedTasks') || '[]');
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Only keep notifications from last week
    const recent = stored.filter(item => 
      new Date(item.time) > oneWeekAgo
    );
    
    recent.forEach(item => {
      notifiedTasks.current.add(item.key);
    });
    
    if (recent.length !== stored.length) {
      localStorage.setItem('notifiedTasks', JSON.stringify(recent));
    }
  }, []);

  // Handle notification clicks
  useEffect(() => {
    const handleNotificationClick = (event) => {
      event.preventDefault();
      window.focus();
      
      if (event.notification.data?.url) {
        // Navigate to the task
        window.location.href = event.notification.data.url;
      }
      
      event.notification.close();
    };

    if ("Notification" in window) {
      // This doesn't work in all browsers but try it
      Notification.onclick = handleNotificationClick;
    }
  }, []);

  return {
    requestPermission,
    showNotification,
    checkTasksDue,
    hasPermission: notificationPermission.current === "granted"
  };
}