/**
 * Redirect Service - Stores intended destinations and redirects users
 * properly after login/logout/registration
 */

// Local storage key for storing intended destinations
const REDIRECT_STORAGE_KEY = 'okr-redirect-path';

/**
 * Saves the intended destination to local storage
 * @param path Path to redirect to after authentication
 */
export function saveRedirectPath(path: string): void {
  // Don't save auth page as redirect destination
  if (path === '/auth') return;
  
  // Save path to local storage
  localStorage.setItem(REDIRECT_STORAGE_KEY, path);
}

/**
 * Gets the saved redirect path from local storage
 * @param defaultPath Default path to return if no saved path exists
 * @returns The saved path or default path
 */
export function getRedirectPath(defaultPath: string = '/'): string {
  const savedPath = localStorage.getItem(REDIRECT_STORAGE_KEY);
  
  // Clear the stored path after retrieving it
  if (savedPath) {
    localStorage.removeItem(REDIRECT_STORAGE_KEY);
  }
  
  return savedPath || defaultPath;
}

/**
 * Clears any saved redirect path
 */
export function clearRedirectPath(): void {
  localStorage.removeItem(REDIRECT_STORAGE_KEY);
}