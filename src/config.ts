/**
 * API Configuration
 * Uses environment variables for API URL, falls back to localhost for development
 */

export const API_BASE_URL = 
  import.meta.env.VITE_API_URL || 'http://localhost:5000'

// For production on Railway, set VITE_API_URL environment variable
// Example: VITE_API_URL=https://your-backend-url.railway.app
