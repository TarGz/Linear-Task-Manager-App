import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, ExternalLink, Download, RefreshCw, Smartphone, RotateCcw } from 'lucide-react';
import linearApi from '../services/linearApi';
import pwaService from '../services/pwaService';
import { APP_VERSION, APP_FEATURES, BUILD_DATE } from '../config/constants';
import './SettingsPage.css';

function SettingsPage({ onApiKeyChange }) {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [userInfo, setUserInfo] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [isForceUpdating, setIsForceUpdating] = useState(false);

  useEffect(() => {
    const currentKey = linearApi.getApiKey();
    if (currentKey) {
      setApiKey(currentKey);
      loadUserInfo(currentKey);
    }

    // Set up PWA update callback
    pwaService.setUpdateCallback((available) => {
      setUpdateAvailable(available);
    });

    // Check initial update status
    setUpdateAvailable(pwaService.isUpdateAvailable());
  }, []);

  const loadUserInfo = async (key) => {
    try {
      linearApi.setApiKey(key);
      const data = await linearApi.testConnection();
      setUserInfo(data.viewer);
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: 'Please enter your Linear API key' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      linearApi.setApiKey(apiKey);
      const data = await linearApi.testConnection();
      
      setUserInfo(data.viewer);
      setMessage({ type: 'success', text: 'API key saved successfully!' });
      onApiKeyChange(true);
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Invalid API key. Please check your key and try again.' 
      });
      linearApi.clearApiKey();
      setUserInfo(null);
      onApiKeyChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    linearApi.clearApiKey();
    setApiKey('');
    setUserInfo(null);
    setMessage({ type: 'success', text: 'API key cleared' });
    onApiKeyChange(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdates(true);
    try {
      await pwaService.checkForUpdates();
      if (!pwaService.isUpdateAvailable()) {
        setMessage({ type: 'success', text: 'You have the latest version!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to check for updates' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const handleUpdateApp = async () => {
    setIsUpdating(true);
    try {
      const success = await pwaService.updateApp();
      if (success) {
        setMessage({ type: 'success', text: 'Update installed! App will reload...' });
        setTimeout(() => {
          pwaService.forceReload();
        }, 1000);
      } else {
        // Fallback for iOS - force reload
        setMessage({ type: 'success', text: 'Reloading app with latest version...' });
        setTimeout(() => {
          pwaService.forceReload();
        }, 1000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Update failed. Please try refreshing manually.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      setIsUpdating(false);
    }
  };

  const handleForceUpdate = async () => {
    setIsForceUpdating(true);
    try {
      setMessage({ type: 'success', text: 'Clearing cache and forcing update...' });
      await pwaService.forceUpdate();
    } catch (error) {
      setMessage({ type: 'error', text: 'Force update failed. Please try refreshing manually.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      setIsForceUpdating(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">Settings</h1>
        </div>
      </div>
      
      <div className="page-content">
        <div className="container">
          <div className="settings-section">
            <h2>Linear API Key</h2>
            <p className="section-description">
              Enter your Linear API key to connect to your workspace and sync your tasks.
            </p>
            
            {message.text && (
              <div className={`${message.type}-message`}>
                {message.text}
              </div>
            )}

            {userInfo && (
              <div className="user-info card">
                <h3>Connected Account</h3>
                <div className="user-details">
                  <div className="user-item">
                    <strong>Name:</strong> {userInfo.name}
                  </div>
                  <div className="user-item">
                    <strong>Email:</strong> {userInfo.email}
                  </div>
                  <div className="user-item">
                    <strong>ID:</strong> {userInfo.id}
                  </div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="apiKey">API Key</label>
              <div className="input-with-button">
                <input
                  id="apiKey"
                  name="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Linear API key"
                  autoComplete="password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="btn btn-icon btn-secondary"
                  onClick={() => setShowApiKey(!showApiKey)}
                  disabled={isLoading}
                >
                  {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="button-group">
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={isLoading || !apiKey.trim()}
              >
                {isLoading ? (
                  <div className="loading-spinner-small"></div>
                ) : (
                  <Save size={20} />
                )}
                Save API Key
              </button>
              
              {userInfo && (
                <button
                  className="btn btn-secondary"
                  onClick={handleClear}
                  disabled={isLoading}
                >
                  Clear API Key
                </button>
              )}
            </div>
          </div>

          <div className="settings-section">
            <h2>How to get your API Key</h2>
            <ol className="api-instructions">
              <li>Go to your Linear settings</li>
              <li>Navigate to the API section</li>
              <li>Create a new personal API key</li>
              <li>Copy the key and paste it above</li>
            </ol>
            
            <a
              href="https://linear.app/settings/api"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <ExternalLink size={20} />
              Open Linear API Settings
            </a>
          </div>

          <div className="settings-section">
            <h2>App Updates</h2>
            <p className="section-description">
              Keep your app up to date with the latest features and improvements.
            </p>
            
            {updateAvailable && (
              <div className="update-available-notice card">
                <div className="update-notice-content">
                  <Smartphone size={20} className="update-icon" />
                  <div>
                    <h4>Update Available!</h4>
                    <p>A new version of the app is ready to install.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="button-group">
              <button
                className="btn btn-secondary"
                onClick={handleCheckForUpdates}
                disabled={isCheckingUpdates || isUpdating || isForceUpdating}
              >
                {isCheckingUpdates ? (
                  <div className="loading-spinner-small"></div>
                ) : (
                  <RefreshCw size={20} />
                )}
                Check for Updates
              </button>
              
              {updateAvailable && (
                <button
                  className="btn btn-primary"
                  onClick={handleUpdateApp}
                  disabled={isUpdating || isCheckingUpdates || isForceUpdating}
                >
                  {isUpdating ? (
                    <div className="loading-spinner-small"></div>
                  ) : (
                    <Download size={20} />
                  )}
                  Update App
                </button>
              )}

              <button
                className="btn btn-outline btn-secondary"
                onClick={handleForceUpdate}
                disabled={isForceUpdating || isUpdating || isCheckingUpdates}
                title="Clear cache and force reload - use if stuck on old version"
              >
                {isForceUpdating ? (
                  <div className="loading-spinner-small"></div>
                ) : (
                  <RotateCcw size={20} />
                )}
                Force Update
              </button>
            </div>
          </div>

          <div className="settings-section">
            <h2>App Information</h2>
            <div className="app-info card">
              <div className="user-item">
                <strong>Version:</strong> {APP_VERSION}
              </div>
              <div className="user-item">
                <strong>Build Date & Time:</strong> {new Date(BUILD_DATE).toLocaleString()}
              </div>
              <div className="user-item">
                <strong>Features:</strong> {APP_FEATURES}
              </div>
              <div className="user-item">
                <strong>Update Status:</strong> {updateAvailable ? '🟡 Update Available' : '🟢 Up to Date'}
              </div>
              <div className="user-item">
                <strong>Offline Support:</strong> {pwaService.isOfflineReady() ? '🟢 Ready' : '🟡 Loading...'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;