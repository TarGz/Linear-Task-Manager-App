import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import pwaService from '../services/pwaService';
import './UpdatePrompt.css';

function UpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    // Only show if there's actually an update and we haven't dismissed it recently
    if (needRefresh) {
      const lastDismissed = localStorage.getItem('update-dismissed-time');
      const now = Date.now();
      
      // Show prompt if never dismissed or dismissed more than 24 hours ago
      if (!lastDismissed || now - parseInt(lastDismissed) > 24 * 60 * 60 * 1000) {
        setShowPrompt(true);
      }
    }
  }, [needRefresh]);

  const handleUpdate = async () => {
    try {
      setShowPrompt(false);

      // First, tell the waiting service worker to activate
      // This returns a promise that resolves when the SW takes control
      await updateServiceWorker(true);

      // Give the SW a moment to fully activate before reloading
      await new Promise(resolve => setTimeout(resolve, 300));

      // Now reload to get the new version
      await pwaService.updateApp();
    } catch (error) {
      console.error('Update failed:', error);
      // Fallback to simple reload
      window.location.reload(true);
    }
  };

  const handleDismiss = () => {
    // Remember when we dismissed it
    localStorage.setItem('update-dismissed-time', Date.now().toString());
    setShowPrompt(false);
    setNeedRefresh(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="update-prompt">
      <div className="update-prompt-content">
        <span className="update-prompt-message">New version available!</span>
        <div className="update-prompt-actions">
          <button onClick={handleDismiss} className="update-prompt-dismiss">
            Later
          </button>
          <button onClick={handleUpdate} className="update-prompt-update">
            Update
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpdatePrompt;
