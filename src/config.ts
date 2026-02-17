/**
 * API Configuration
 * Uses environment variables for API URL, falls back to current host for development
 */

function getDefaultAPIURL(): string {
  // If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  // For development, use current host + :5000 (works for both localhost and network access)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const protocol = window.location.protocol
    return `${protocol}//${hostname}:5000`
  }

  // Fallback for server-side rendering (though unlikely in this app)
  return 'http://localhost:5000'
}

export const API_BASE_URL = getDefaultAPIURL()

// For production on Railway, set VITE_API_URL environment variable
// Example: VITE_API_URL=https://your-backend-url.railway.app
