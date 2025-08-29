import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { APP_VERSION, APP_FEATURES, BUILD_DATE } from './config/constants'
import pwaService from './services/pwaService'
import './index.css'
import App from './App.jsx'

console.log(`🚀 Linear Task Manager PWA v${APP_VERSION}`);
console.log(`📦 Features: ${APP_FEATURES}`);
console.log(`🕐 Built: ${new Date(BUILD_DATE).toLocaleString()}`);
console.log(`🔄 Update System: Enhanced with GitHub Pages integration`);
console.log(`📱 iOS PWA: Fully optimized for iPhone home screen apps`);

// Initialize PWA service
pwaService.init();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
