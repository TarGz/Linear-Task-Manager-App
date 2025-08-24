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
    window.location.reload();
  }

  // Check for updates manually
  async checkForUpdates() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          return true;
        }
      } catch (error) {
        console.error('Failed to check for updates:', error);
      }
    }
    return false;
  }
}

// Create singleton instance
const pwaService = new PWAService();

export default pwaService;