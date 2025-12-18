// Spotify Web API Service
// Credentials hardcoded for internal backoffice use

const SPOTIFY_CLIENT_ID = '4f60b6a5accf4e329987b3d71b280d9a';
const SPOTIFY_CLIENT_SECRET = '1249ed0458124bb184225611d2b3f8cb';
const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

let accessToken = null;
let tokenExpiry = null;

export const spotifyAPI = {
  /**
   * Get Spotify access token using Client Credentials Flow
   * @returns {Promise<string|null>} Access token
   */
  getAccessToken: async () => {
    // Return cached token if still valid
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
      return accessToken;
    }

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      console.error('Spotify credentials are not configured');
      return null;
    }

    try {
      const credentials = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);

      const response = await fetch(SPOTIFY_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error('Failed to get Spotify access token');
      }

      const data = await response.json();

      accessToken = data.access_token;
      // Set expiry to 5 minutes before actual expiry for safety
      tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

      return accessToken;
    } catch (error) {
      console.error('Spotify authentication error:', error);
      return null;
    }
  },

  /**
   * Search for tracks on Spotify
   * @param {string} query - Search query
   * @param {number} limit - Maximum number of results (default: 5, max: 50)
   * @returns {Promise<Object>} Search results
   */
  searchTracks: async (query, limit = 5) => {
    const token = await spotifyAPI.getAccessToken();

    if (!token) {
      return {
        success: false,
        error: 'Spotify authentication failed. Please check your credentials in .env file'
      };
    }

    try {
      const params = new URLSearchParams({
        q: query,
        type: 'track',
        limit: Math.min(limit, 50).toString()
      });

      const response = await fetch(`${SPOTIFY_API_BASE_URL}/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Spotify API request failed');
      }

      const data = await response.json();

      return {
        success: true,
        data: data.tracks?.items || []
      };
    } catch (error) {
      console.error('Spotify API error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Get track details by ID
   * @param {string} trackId - Spotify track ID
   * @returns {Promise<Object>} Track details
   */
  getTrackDetails: async (trackId) => {
    const token = await spotifyAPI.getAccessToken();

    if (!token) {
      return {
        success: false,
        error: 'Spotify authentication failed'
      };
    }

    try {
      const response = await fetch(`${SPOTIFY_API_BASE_URL}/tracks/${trackId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch track details');
      }

      const data = await response.json();

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Spotify API error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};
