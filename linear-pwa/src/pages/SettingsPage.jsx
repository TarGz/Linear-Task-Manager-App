import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, ExternalLink, Download, RefreshCw, Smartphone, RotateCcw, Archive } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import linearApi from '../services/linearApi';
import pwaService from '../services/pwaService';
import { APP_VERSION, APP_FEATURES, BUILD_DATE } from '../config/constants';
import './SettingsPage.css';

function SettingsPage({ onApiKeyChange, onOpenBurgerMenu }) {
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
  const [issueCounts, setIssueCounts] = useState(null);
  const [isCountingIssues, setIsCountingIssues] = useState(false);
  const [isCleaningIssues, setIsCleaningIssues] = useState(false);

  useEffect(() => {
    const currentKey = linearApi.getApiKey();
    if (currentKey) {
      setApiKey(currentKey);
      loadUserInfo(currentKey);
      loadIssueCounts();
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
      await loadIssueCounts();
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  };

  const loadIssueCounts = async () => {
    try {
      setIsCountingIssues(true);
      const data = await linearApi.getAllIssues({ includeArchived: true });
      const nodes = data?.issues?.nodes || [];
      const archived = nodes.filter(n => !!n.archivedAt);
      const active = nodes.filter(n => !n.archivedAt);
      const done = active.filter(n => n?.state?.type === 'completed');
      const canceled = active.filter(n => n?.state?.type === 'canceled');
      const open = active.filter(n => n?.state?.type !== 'completed' && n?.state?.type !== 'canceled');
      setIssueCounts({ total: active.length, archived: archived.length, done: done.length, canceled: canceled.length, open: open.length });
    } catch (error) {
      console.error('Failed to load issue counts:', error);
    } finally {
      setIsCountingIssues(false);
    }
  };

  const handleCleanIssues = async () => {
    if (!window.confirm('Archive all Done and Canceled issues? This cannot be undone easily.')) return;
    try {
      setIsCleaningIssues(true);
      setMessage({ type: '', text: '' });
      const data = await linearApi.getAllIssues();
      const nodes = data?.issues?.nodes || [];
      const targets = nodes.filter(n => !n.archivedAt && (n?.state?.type === 'completed' || n?.state?.type === 'canceled'));
      let success = 0;
      for (const issue of targets) {
        try {
          const res = await linearApi.archiveIssue(issue.id);
          if (res?.issueArchive?.success) success += 1;
        } catch (e) {
          console.error('Archive failed for issue', issue.id, e);
        }
      }
      setMessage({ type: 'success', text: `Archived ${success} of ${targets.length} issues.` });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
      await loadIssueCounts();
    } catch (error) {
      console.error('Clean issues failed:', error);
      setMessage({ type: 'error', text: 'Failed to archive issues.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    } finally {
      setIsCleaningIssues(false);
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
        setMessage({ type: 'success', text: `🎉 You're up to date! Running the latest version ${APP_VERSION}` });
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
    
    // Check if running on iOS PWA
    const isIOSPWA = pwaService.isIOSPWA();
    console.log('🔄 User clicked Update App', 'iOS PWA:', isIOSPWA);
    
    try {
      if (isIOSPWA) {
        setMessage({ type: 'success', text: '📱 Updating iOS PWA... App will reload shortly...' });
        // For iOS PWA, shorter delay to prevent loops
        setTimeout(() => {
          pwaService.updateApp();
          // Don't set loading state back as app will reload
        }, 800);
      } else {
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
      }
      
    } catch (error) {
      console.error('❌ Update failed:', error);
      setMessage({ type: 'error', text: 'Update failed. Please try Force Update instead.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      setIsUpdating(false);
    }
  };

  const handleForceUpdate = async () => {
    setIsForceUpdating(true);
    
    // Check if running on iOS PWA
    const isIOSPWA = pwaService.isIOSPWA();
    console.log('💪 User clicked Force Update', 'iOS PWA:', isIOSPWA);
    
    try {
      if (isIOSPWA) {
        setMessage({ type: 'success', text: '📱 Force updating iOS PWA... Clearing cache...' });
        // For iOS PWA, direct force reload without complex cache clearing
        setTimeout(() => {
          pwaService.forceReload();
          // Don't reset loading state as app will reload
        }, 800);
      } else {
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
      }
      
    } catch (error) {
      console.error('❌ Force update failed:', error);
      setMessage({ type: 'error', text: 'Force update failed. Please close and reopen the app.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      setIsForceUpdating(false);
    }
  };

  return (
    <div className="settings-page">
      <PageHeader
        title="Settings"
        onOpenBurgerMenu={onOpenBurgerMenu}
      />
      
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
            <h2>🧮 Issues Overview</h2>
            <p className="section-description">
              Quick counts for your workspace and a cleanup tool to archive completed and canceled issues.
            </p>

            <div className="user-info card">
              {issueCounts ? (
                <div className="user-details">
                  <div className="user-item"><strong>Total:</strong> {issueCounts.total}</div>
                  <div className="user-item"><strong>Open:</strong> {issueCounts.open}</div>
                  <div className="user-item"><strong>Done:</strong> {issueCounts.done}</div>
                  <div className="user-item"><strong>Canceled:</strong> {issueCounts.canceled}</div>
                  <div className="user-item"><strong>Archived:</strong> {issueCounts.archived}</div>
                </div>
              ) : (
                <div className="user-details">
                  <div className="user-item">No data yet. Save API key and refresh.</div>
                </div>
              )}
            </div>

            <div className="button-group">
              <button
                className="btn btn-secondary"
                onClick={loadIssueCounts}
                disabled={isCountingIssues || isCleaningIssues}
              >
                {isCountingIssues ? <div className="loading-spinner-small"></div> : <RefreshCw size={20} />}
                Refresh Counts
              </button>
              <button
                className="btn btn-outline btn-secondary"
                onClick={handleCleanIssues}
                disabled={isCleaningIssues || isCountingIssues}
                title="Archive all completed and canceled issues"
              >
                {isCleaningIssues ? <div className="loading-spinner-small"></div> : <Archive size={20} />}
                Clean: Archive Done + Canceled
              </button>
            </div>
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
