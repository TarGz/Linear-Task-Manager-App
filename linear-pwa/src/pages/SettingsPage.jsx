import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, ExternalLink } from 'lucide-react';
import linearApi from '../services/linearApi';
import { APP_VERSION, APP_FEATURES, BUILD_DATE } from '../config/constants';
import './SettingsPage.css';

function SettingsPage({ onApiKeyChange }) {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const currentKey = linearApi.getApiKey();
    if (currentKey) {
      setApiKey(currentKey);
      loadUserInfo(currentKey);
    }
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
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Linear API key"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;