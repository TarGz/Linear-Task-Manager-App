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
    if (this.updateSW && this.needRefresh) {
      try {
        await this.updateSW(true);
        this.needRefresh = false;
        return true;
      } catch (error) {
        console.error('Failed to update PWA:', error);
        return false;
      }
    }
    return false;
  }

  // Force reload the app (fallback for iOS)
  forceReload() {
    // Add timestamp to URL to force iOS Safari to bypass cache
    const url = new URL(window.location.href);
    url.searchParams.set('_t', Date.now());
    window.location.href = url.toString();
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

  // Check for updates by comparing build timestamp from deployed app
  async checkDeployedVersion(currentVersion, currentBuildDate) {
    try {
      // Check the deployed index.html for version info
      const response = await fetch('https://targz.github.io/Linear-Task-Manager-App/index.html', { 
        cache: 'no-store' 
      });
      
      if (response.ok) {
        const html = await response.text();
        
        // Extract app-version meta tag
        const versionMatch = html.match(/<meta name="app-version" content="([^"]+)"/);
        // Extract build-timestamp meta tag  
        const timestampMatch = html.match(/<meta name="build-timestamp" content="([^"]+)"/);
        
        if (versionMatch && timestampMatch) {
          const deployedVersion = versionMatch[1];
          const deployedTimestamp = new Date(timestampMatch[1]);
          const currentTimestamp = new Date(currentBuildDate);
          
          console.log(`Deployed version: ${deployedVersion}, Current: ${currentVersion}`);
          console.log(`Deployed timestamp: ${deployedTimestamp}, Current: ${currentTimestamp}`);
          
          // Only consider actual version updates, not just newer builds
          const versionCompare = this.compareVersions(currentVersion, deployedVersion);
          const isNewerVersion = versionCompare < 0;
          
          return {
            hasUpdate: isNewerVersion,
            latestVersion: deployedVersion,
            deployedTimestamp: deployedTimestamp.toISOString(),
            updateType: 'version',
            currentVersion,
            buildTimestamp: currentBuildDate
          };
        }
      }
    } catch (error) {
      console.error('Failed to check deployed version:', error);
    }
    return { hasUpdate: false };
  }

  // Enhanced update checking with multiple methods
  async checkForUpdates() {
    console.log('Checking for updates...');
    
    // First check service worker for PWA updates
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          
          // Give service worker time to detect updates
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (this.needRefresh) {
            console.log('PWA update detected via service worker');
            return { type: 'pwa', available: true };
          }
        }
      } catch (error) {
        console.error('Failed to check service worker updates:', error);
      }
    }

    // Import current version and check for updates
    try {
      const { APP_VERSION, BUILD_DATE } = await import('../config/constants.js');
      
      // First try GitHub releases
      const githubCheck = await this.checkGitHubVersion(APP_VERSION);
      
      if (githubCheck.hasUpdate) {
        console.log('GitHub version update available');
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
      
      // If no GitHub releases, check deployed version
      if (githubCheck.noReleases) {
        console.log('No GitHub releases found, checking deployed version...');
        const deployedCheck = await this.checkDeployedVersion(APP_VERSION, BUILD_DATE);
        
        if (deployedCheck.hasUpdate) {
          console.log('Deployed version update available');
          this.needRefresh = true;
          if (this.updateCallback) {
            this.updateCallback(true);
          }
          return {
            type: 'deployed',
            available: true,
            currentVersion: APP_VERSION,
            latestVersion: deployedCheck.latestVersion,
            updateType: deployedCheck.updateType,
            deployedTimestamp: deployedCheck.deployedTimestamp
          };
        }
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }

    console.log('No updates available');
    
    // Return version info even when no updates
    try {
      const { APP_VERSION } = await import('../config/constants.js');
      return { 
        type: 'none', 
        available: false, 
        currentVersion: APP_VERSION,
        latestVersion: APP_VERSION
      };
    } catch (error) {
      return { type: 'none', available: false };
    }
  }
}

// Create singleton instance
const pwaService = new PWAService();

export default pwaService;