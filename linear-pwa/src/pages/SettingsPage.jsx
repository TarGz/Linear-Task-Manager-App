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
  const [updateInfo, setUpdateInfo] = useState(null);
  const [versionInfo, setVersionInfo] = useState(null);
  const [hasCheckedForUpdates, setHasCheckedForUpdates] = useState(false);
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
      console.log('Checking for updates...');
      const result = await pwaService.checkForUpdates();
      
      // Always store version information for display
      setVersionInfo({
        currentVersion: result.currentVersion || APP_VERSION,
        latestVersion: result.latestVersion || APP_VERSION,
        type: result.type,
        checked: true
      });
      setHasCheckedForUpdates(true);

      if (result.available) {
        setUpdateAvailable(true);
        setUpdateInfo(result);
        
        if (result.type === 'github') {
          setMessage({ 
            type: 'success', 
            text: `Update available! Version ${result.latestVersion} is ready.` 
          });
        } else if (result.type === 'deployed') {
          const updateTypeText = result.updateType === 'version' ? 'version' : 'build';
          setMessage({ 
            type: 'success', 
            text: `Update available! Newer ${updateTypeText} ${result.latestVersion} is deployed.` 
          });
        } else {
          setMessage({ type: 'success', text: 'PWA update available!' });
        }
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      } else {
        setUpdateAvailable(false);
        setUpdateInfo(null);
        setMessage({ type: 'success', text: `✅ You're up to date! Running version ${APP_VERSION}` });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Update check failed:', error);
      setMessage({ type: 'error', text: 'Failed to check for updates' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const handleUpdateApp = async () => {
    setIsUpdating(true);
    try {
      console.log('🔄 User clicked Update App');
      setMessage({ type: 'success', text: '🔄 Updating app... Please wait...' });
      
      // Give user feedback before updating
      setTimeout(async () => {
        try {
          await pwaService.updateApp();
          // updateApp now handles the reload internally
        } catch (error) {
          console.error('❌ Update process failed:', error);
          setMessage({ type: 'error', text: 'Update failed. Trying force reload...' });
          setTimeout(() => {
            pwaService.forceReload();
          }, 1000);
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ Update failed:', error);
      setMessage({ type: 'error', text: 'Update failed. Please refresh manually or try Force Update.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      setIsUpdating(false);
    }
  };

  const handleForceUpdate = async () => {
    setIsForceUpdating(true);
    try {
      console.log('💪 User clicked Force Update');
      setMessage({ type: 'success', text: '💪 Force updating... Clearing cache and reloading...' });
      
      // Force update with cache clearing
      setTimeout(async () => {
        try {
          await pwaService.forceUpdate();
          // forceUpdate handles the reload internally
        } catch (error) {
          console.error('❌ Force update failed:', error);
          // Last resort - simple reload
          setMessage({ type: 'success', text: 'Reloading app...' });
          setTimeout(() => {
            window.location.reload(true);
          }, 1000);
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ Force update failed:', error);
      setMessage({ type: 'error', text: 'Force update failed. Please refresh the page manually.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      setIsForceUpdating(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">⚙️ Settings</h1>
        </div>
      </div>
      
      <div className="page-content">
        <div className="container">
          <div className="settings-section">
            <h2>🔑 Linear API Key</h2>
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
            <h2>📚 How to get your API Key</h2>
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
            <h2>🔄 App Updates</h2>
            <p className="section-description">
              Keep your app up to date with the latest features and improvements.
            </p>
            
            {updateAvailable && updateInfo && (
              <div className="update-available-notice card">
                <div className="update-notice-content">
                  <Smartphone size={20} className="update-icon" />
                  <div>
                    <h4>Update Available!</h4>
                    <p>
                      Current version: <strong>{updateInfo.currentVersion || APP_VERSION}</strong><br />
                      Latest version: <strong>{updateInfo.latestVersion}</strong>
                    </p>
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

              {hasCheckedForUpdates && (
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
              )}
            </div>

            {versionInfo && versionInfo.checked && (
              <div className="version-info-display card">
                <h4>Version Check Results</h4>
                <div className="version-details">
                  <div className="version-item">
                    <span className="version-label">Current:</span>
                    <span className="version-value">{versionInfo.currentVersion}</span>
                  </div>
                  <div className="version-item">
                    <span className="version-label">Latest:</span>
                    <span className="version-value">{versionInfo.latestVersion}</span>
                  </div>
                  <div className="version-item">
                    <span className="version-label">Status:</span>
                    <span className={`version-status ${versionInfo.currentVersion === versionInfo.latestVersion ? 'up-to-date' : 'update-available'}`}>
                      {versionInfo.currentVersion === versionInfo.latestVersion ? '🟢 Up to Date' : '🟡 Update Available'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="settings-section">
            <h2>📱 App Information</h2>
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