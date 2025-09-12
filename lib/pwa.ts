// PWA utilities for service worker registration and offline handling

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
  isInstalled: boolean;
  isStandalone: boolean;
  canInstall: boolean;
  isOnline: boolean;
  swRegistration: ServiceWorkerRegistration | null;
}

class PWAManager {
  private static instance: PWAManager;
  private state: PWAState = {
    isInstalled: false,
    isStandalone: false,
    canInstall: false,
    isOnline: navigator.onLine,
    swRegistration: null
  };
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private listeners: Set<(state: PWAState) => void> = new Set();

  private constructor() {
    this.initialize();
  }

  static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager();
    }
    return PWAManager.instance;
  }

  private async initialize() {
    if (typeof window === 'undefined') return;

    // Check if running in standalone mode
    this.state.isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    // Register service worker
    await this.registerServiceWorker();

    // Setup event listeners
    this.setupEventListeners();

    // Check installation status
    this.checkInstallationStatus();

    this.notifyStateChange();
  }

  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      this.state.swRegistration = registration;

      registration.addEventListener('updatefound', () => {
        console.log('Service Worker update found');
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker installed, show update notification
              this.showUpdateNotification();
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', this.handleSWMessage.bind(this));

      console.log('Service Worker registered successfully');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  private setupEventListeners(): void {
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.state.canInstall = true;
      this.notifyStateChange();
    });

    // Listen for app installation
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed');
      this.state.isInstalled = true;
      this.state.canInstall = false;
      this.deferredPrompt = null;
      this.notifyStateChange();
    });

    // Listen for online/offline status
    window.addEventListener('online', () => {
      this.state.isOnline = true;
      this.notifyStateChange();
      this.triggerBackgroundSync();
    });

    window.addEventListener('offline', () => {
      this.state.isOnline = false;
      this.notifyStateChange();
    });
  }

  private checkInstallationStatus(): void {
    // Check if app is installed (heuristic approach)
    this.state.isInstalled = this.state.isStandalone;
  }

  private handleSWMessage(event: MessageEvent): void {
    const { type, data } = event.data;

    switch (type) {
      case 'SYNC_COMPLETE':
        console.log(`Background sync completed: ${data.syncedCount} entries synced`);
        this.showSyncNotification(data.syncedCount);
        break;
      case 'CACHE_UPDATED':
        console.log('Cache updated');
        break;
    }
  }

  private showUpdateNotification(): void {
    // This would typically show a user notification
    console.log('App update available');
    
    // Dispatch custom event for UI components to handle
    window.dispatchEvent(new CustomEvent('pwa-update-available'));
  }

  private showSyncNotification(count: number): void {
    if (count > 0) {
      window.dispatchEvent(new CustomEvent('pwa-sync-complete', { 
        detail: { count } 
      }));
    }
  }

  private notifyStateChange(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Public API
  public getState(): PWAState {
    return { ...this.state };
  }

  public subscribe(listener: (state: PWAState) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      this.deferredPrompt = null;
      this.state.canInstall = false;
      this.notifyStateChange();

      return choiceResult.outcome === 'accepted';
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  }

  public async updateServiceWorker(): Promise<void> {
    if (!this.state.swRegistration) return;

    try {
      await this.state.swRegistration.update();
      console.log('Service Worker updated');
    } catch (error) {
      console.error('Service Worker update failed:', error);
    }
  }

  public triggerBackgroundSync(): void {
    if (!this.state.swRegistration || !this.state.isOnline) return;

    // Register background sync
    const registration = this.state.swRegistration as any;
    registration.sync?.register('sync-sleep-entries')
      .then(() => console.log('Background sync registered'))
      .catch((error: any) => console.error('Background sync registration failed:', error));
  }

  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  public async saveOfflineEntry(entryData: any): Promise<void> {
    // This would typically save to IndexedDB for background sync
    // For now, store in localStorage as fallback
    try {
      const offlineEntries = JSON.parse(localStorage.getItem('offline-entries') || '[]');
      offlineEntries.push({
        id: Date.now().toString(),
        data: entryData,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('offline-entries', JSON.stringify(offlineEntries));
      
      console.log('Entry saved offline');
    } catch (error) {
      console.error('Failed to save offline entry:', error);
    }
  }

  public getOfflineEntries(): any[] {
    try {
      return JSON.parse(localStorage.getItem('offline-entries') || '[]');
    } catch {
      return [];
    }
  }

  public clearOfflineEntries(): void {
    localStorage.removeItem('offline-entries');
  }
}

// React hook for PWA state
export function usePWA() {
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstalled: false,
    isStandalone: false,
    canInstall: false,
    isOnline: true,
    swRegistration: null
  });

  useEffect(() => {
    const pwaManager = PWAManager.getInstance();
    
    // Subscribe to state changes
    const unsubscribe = pwaManager.subscribe(setPwaState);
    
    // Set initial state
    setPwaState(pwaManager.getState());

    return unsubscribe;
  }, []);

  const installApp = useCallback(async () => {
    const pwaManager = PWAManager.getInstance();
    return await pwaManager.showInstallPrompt();
  }, []);

  const updateApp = useCallback(async () => {
    const pwaManager = PWAManager.getInstance();
    await pwaManager.updateServiceWorker();
  }, []);

  const requestNotifications = useCallback(async () => {
    const pwaManager = PWAManager.getInstance();
    return await pwaManager.requestNotificationPermission();
  }, []);

  return {
    ...pwaState,
    installApp,
    updateApp,
    requestNotifications
  };
}

// Export singleton instance
export const pwaManager = typeof window !== 'undefined' ? PWAManager.getInstance() : null;
export default PWAManager;