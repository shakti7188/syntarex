import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

const VERSION_STORAGE_KEY = 'synterax-app-version';
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface VersionInfo {
  version: string;
  buildTime: string;
}

// Force a complete cache-busting reload
const forceHardReload = async () => {
  // Clear service workers
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
    } catch (e) {
      console.warn('Failed to unregister service workers:', e);
    }
  }
  
  // Clear all caches
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    } catch (e) {
      console.warn('Failed to clear caches:', e);
    }
  }
  
  // Force reload with cache-busting query param
  window.location.href = window.location.origin + window.location.pathname + '?_v=' + Date.now();
};

export function useVersionCheck() {
  const queryClient = useQueryClient();

  const checkVersion = async () => {
    try {
      // Fetch version.json with aggressive cache bypass
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        console.warn('Failed to fetch version info');
        return;
      }

      const versionInfo: VersionInfo = await response.json();
      const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);

      // If this is the first visit or version has changed
      if (storedVersion && storedVersion !== versionInfo.buildTime) {
        console.log('New version detected, forcing update...');
        
        // Show update notification
        toast({
          title: "Updating to latest version...",
          description: "Please wait a moment",
          duration: 2000,
        });

        // Clear React Query cache
        queryClient.clear();

        // Store new version before reload
        localStorage.setItem(VERSION_STORAGE_KEY, versionInfo.buildTime);

        // Force hard reload after toast is shown
        setTimeout(() => {
          forceHardReload();
        }, 1500);
      } else if (!storedVersion) {
        // First visit, just store the version
        localStorage.setItem(VERSION_STORAGE_KEY, versionInfo.buildTime);
      }
    } catch (error) {
      // Silently fail - app continues to work normally
      console.warn('Version check failed:', error);
    }
  };

  useEffect(() => {
    // Check version on mount
    checkVersion();

    // Set up periodic checks for long sessions
    const intervalId = setInterval(checkVersion, CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, []);
}
