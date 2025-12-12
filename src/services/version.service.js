/**
 * Version Service
 * Handles version checking and cache management
 */

import { VERSION } from '../version'

/**
 * Get stored version from localStorage
 */
export function getStoredVersion() {
  return localStorage.getItem('app-version') || '0.0.0'
}

/**
 * Store current version to localStorage
 */
export function storeCurrentVersion() {
  localStorage.setItem('app-version', VERSION)
}

/**
 * Check if a new version is available by comparing stored version with current version
 */
export function isNewVersionAvailable() {
  const storedVersion = getStoredVersion()
  return storedVersion !== VERSION
}

/**
 * Get current app version
 */
export function getCurrentVersion() {
  return VERSION
}

/**
 * Clear browser cache and reload the application
 * This clears service worker cache and local cache
 */
export async function clearCacheAndReload() {
  try {
    // Clear localStorage
    localStorage.clear()

    // Clear sessionStorage
    sessionStorage.clear()

    // Clear all caches registered with service worker
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
    }

    // Clear service worker registration
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of registrations) {
        await registration.unregister()
      }
    }

    // Store new version and reload
    storeCurrentVersion()

    // Force reload without cache
    window.location.href = window.location.pathname
  } catch (error) {
    console.error('Error clearing cache:', error)
    // Fallback: just reload
    window.location.reload(true)
  }
}

/**
 * Check version on app startup
 */
export function initializeVersionCheck() {
  const storedVersion = getStoredVersion()

  if (storedVersion === '0.0.0') {
    // First time - store current version
    storeCurrentVersion()
  } else if (storedVersion !== VERSION) {
    // New version detected - will trigger update notification
    return true
  }

  return false
}
