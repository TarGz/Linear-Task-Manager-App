// PWA Update Service
class PWAService {
  constructor() {
    this.updateCallback = null;
    this.needRefresh = false;
    this.updateSW = null;
    this.offlineReady = false;
  }

  // Initialize PWA service worker
  init() {
    if ('serviceWorker' in navigator) {
      // Import registerSW dynamically to avoid issues in non-PWA environments
      import('virtual:pwa-register').then(({ registerSW }) => {
        this.updateSW = registerSW({
          onNeedRefresh: () => {
            console.log('PWA update available');
            this.needRefresh = true;
            if (this.updateCallback) {
              this.updateCallback(true);
            }
          },
          onOfflineReady: () => {
            console.log('PWA ready to work offline');
            this.offlineReady = true;
          },
          onRegisterError: (error) => {
            console.error('SW registration error', error);
          }
        });
      }).catch(error => {
        console.log('PWA not available:', error);
      });
    }
  }

  // Set callback for update notifications
  setUpdateCallback(callback) {
    this.updateCallback = callback;
  }

  // Check if update is available
  isUpdateAvailable() {
    return this.needRefresh;
  }

  // Check if app is ready offline
  isOfflineReady() {
    return this.offlineReady;
  }

  // Update the app
  async updateApp() {
    console.log('🔄 Starting update process...');
    console.log('📱 iOS PWA:', this.isIOSPWA(), 'Has SW Update:', !!this.updateSW, 'Need Refresh:', this.needRefresh);
    
    // For iOS PWA, skip service worker and go directly to force reload
    if (this.isIOSPWA()) {
      console.log('📱 iOS PWA detected - skipping service worker, using force reload');
      this.forceReload();
      return true;
    }
    
    // If we have a service worker update, try it first (non-iOS PWA)
    if (this.updateSW && this.needRefresh) {
      try {
        console.log('📦 Updating via service worker...');
        await this.updateSW(true);
        this.needRefresh = false;
        return true;
      } catch (error) {
        console.error('❌ Service worker update failed:', error);
      }
    }
    
    // For GitHub Pages updates or when SW update fails, force reload
    console.log('🔄 Using force reload method...');
    this.forceReload();
    return true; // Always return true since forceReload will handle the update
  }

  // Check if running as iOS PWA
  isIOSPWA() {
    return window.navigator.standalone === true || 
           window.matchMedia('(display-mode: standalone)').matches;
  }

  // Check if running on iOS
  isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  // Force reload the app (with iOS PWA specific handling)
  forceReload() {
    console.log('🔄 Force reloading app...');
    console.log('📱 iOS PWA:', this.isIOSPWA(), 'iOS Device:', this.isIOS());
    
    // Clear all possible caches first
    try {
      // Clear session storage
      sessionStorage.clear();
      
      if (this.isIOSPWA()) {
        console.log('📱 iOS PWA detected - using special reload method');
        
        // For iOS PWA, we need to navigate to the base URL without parameters
        // then reload to ensure proper cache clearing
        const baseUrl = new URL(window.location.origin + window.location.pathname);
        
        // First navigate to base URL
        window.location.href = baseUrl.toString();
        
        // Then reload after a short delay
        setTimeout(() => {
          window.location.reload(true);
        }, 100);
        
      } else {
        // Regular browser handling
        const url = new URL(window.location.href);
        url.searchParams.set('_t', Date.now());
        url.searchParams.set('_refresh', '1');
        url.searchParams.set('_v', Math.random().toString(36).substring(2));
        
        console.log('🚀 Redirecting to:', url.toString());
        window.location.replace(url.toString());
      }
      
    } catch (error) {
      console.error('❌ Force reload error:', error);
      // Fallback to simple reload
      window.location.reload(true);
    }
  }

  // Clear all caches and force update
  async clearAllCaches() {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('All caches cleared');
        return true;
      } catch (error) {
        console.error('Failed to clear caches:', error);
        return false;
      }
    }
    return false;
  }

  // Force update with cache clearing
  async forceUpdate() {
    try {
      // Clear all caches
      await this.clearAllCaches();
      
      // Clear localStorage version info to force refresh
      localStorage.removeItem('pwa-version');
      localStorage.removeItem('app-cache-timestamp');
      
      // Unregister service worker
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }
      
      // iOS Safari specific: Clear session storage and add cache busting
      sessionStorage.clear();
      
      // Force reload with cache busting for iOS
      const url = new URL(window.location.href);
      url.searchParams.set('_cache_bust', Date.now());
      url.searchParams.set('_ios_update', '1');
      window.location.href = url.toString();
      
      return true;
    } catch (error) {
      console.error('Failed to force update:', error);
      return false;
    }
  }

  // Compare version strings (semantic versioning)
  compareVersions(current, latest) {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);
    
    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const latestPart = latestParts[i] || 0;
      
      if (currentPart < latestPart) return -1;
      if (currentPart > latestPart) return 1;
    }
    return 0;
  }

  // Check for updates from GitHub (for production version checking)
  async checkGitHubVersion(currentVersion) {
    try {
      const response = await fetch('https://api.github.com/repos/TarGz/Linear-Task-Manager-App/releases/latest');
      if (response.ok) {
        const release = await response.json();
        const latestVersion = release.tag_name.replace(/^v/, ''); // Remove 'v' prefix if present
        
        console.log(`Current version: ${currentVersion}, Latest: ${latestVersion}`);
        
        return {
          hasUpdate: this.compareVersions(currentVersion, latestVersion) < 0,
          latestVersion,
          releaseUrl: release.html_url,
          releaseNotes: release.body
        };
      } else if (response.status === 404) {
        console.log('No GitHub releases found - repository has no releases yet');
        return { hasUpdate: false, latestVersion: currentVersion, noReleases: true };
      }
    } catch (error) {
      console.error('Failed to check GitHub version:', error);
    }
    return { hasUpdate: false, latestVersion: currentVersion };
  }


  // Simplified update checking using GitHub releases only
  async checkForUpdates() {
    console.log('🔍 Checking for updates via GitHub Releases API...');
    
    try {
      const { APP_VERSION } = await import('../config/constants.js');
      console.log(`📦 Current version: ${APP_VERSION}`);
      
      // Check GitHub releases (primary and only method)
      const githubCheck = await this.checkGitHubVersion(APP_VERSION);
      
      if (githubCheck.hasUpdate) {
        console.log('✅ GitHub version update available!');
        this.needRefresh = true;
        if (this.updateCallback) {
          this.updateCallback(true);
        }
        return { 
          type: 'github', 
          available: true, 
          currentVersion: APP_VERSION,
          latestVersion: githubCheck.latestVersion,
          releaseUrl: githubCheck.releaseUrl,
          releaseNotes: githubCheck.releaseNotes
        };
      }
      
      // No update available but return current version info
      console.log('📋 No updates available - app is up to date');
      return {
        type: 'github',
        available: false,
        currentVersion: APP_VERSION,
        latestVersion: githubCheck.latestVersion || APP_VERSION,
        releaseUrl: githubCheck.releaseUrl,
        noReleases: githubCheck.noReleases
      };
      
    } catch (error) {
      console.error('❌ Failed to check for updates:', error);
      
      // Fallback - return current version
      try {
        const { APP_VERSION } = await import('../config/constants.js');
        return { 
          type: 'error', 
          available: false, 
          currentVersion: APP_VERSION,
          latestVersion: APP_VERSION,
          error: error.message
        };
      } catch (importError) {
        return { 
          type: 'error', 
          available: false,
          error: 'Failed to load version information'
        };
      }
    }
  }
}

// Create singleton instance
const pwaService = new PWAService();

export default pwaService;