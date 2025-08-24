import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { APP_VERSION, APP_FEATURES, BUILD_DATE } from './config/constants'
import pwaService from './services/pwaService'
import './index.css'
import App from './App.jsx'

console.log(`Linear PWA Version: ${APP_VERSION} - Features: ${APP_FEATURES} - Built: ${BUILD_DATE}`);

// Initialize PWA service
pwaService.init();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
