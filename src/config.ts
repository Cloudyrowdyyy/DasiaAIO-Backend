/**
 * API Configuration
 * For production on Railway, add `?api_host=https://backend-service:port` to the frontend URL
 * Or set VITE_API_URL environment variable
 */

function getDefaultAPIURL(): string {
  // If VITE_API_URL is explicitly set (e.g., in Railway production), use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  // For development and runtime detection
  if (typeof window !== 'undefined') {
    // Check URL query parameters for api_host (useful for Railway)
    const params = new URLSearchParams(window.location.search)
    const apiHostParam = params.get('api_host')
    if (apiHostParam) {
      return apiHostParam
    }

    const hostname = window.location.hostname
    const protocol = window.location.protocol
    const port = window.location.port
    
    // If running on localhost or 127.0.0.1, use port 5000 for backend
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:5000`
    }
    
    // For remote IPs (mobile/tablet on local network), use port 5000
    // For Railway/deployed apps on typical domains, assume backend is on same host:
    // Try the same host with default backend port first
    return `${protocol}//${hostname}:5000`
  }

  // Fallback
  return 'http://localhost:5000'
}

export const API_BASE_URL = getDefaultAPIURL()
