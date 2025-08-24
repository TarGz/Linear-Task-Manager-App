import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { APP_VERSION, APP_FEATURES, BUILD_DATE } from './config/constants'
import './index.css'
import App from './App.jsx'

console.log(`Linear PWA Version: ${APP_VERSION} - Features: ${APP_FEATURES} - Built: ${BUILD_DATE}`);

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New version available! Reload to update?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
