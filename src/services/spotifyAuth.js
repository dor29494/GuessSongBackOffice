/**
 * Spotify OAuth Authentication Service
 * Implements Authorization Code Flow with PKCE for secure user authentication
 *
 * Required Scopes for Web Playback SDK:
 * - streaming: Play content
 * - user-read-email: Read user's email
 * - user-read-private: Read user's subscription details
 * - user-read-playback-state: Read playback state
 * - user-modify-playback-state: Control playback
 */

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
const REDIRECT_URI = window.location.origin + '/callback';
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing'
].join(' ');

// Helper function to generate random string for PKCE
const generateRandomString = (length) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
};

// Generate code challenge for PKCE
const sha256 = async (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

const base64encode = (input) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

export const spotifyAuth = {
  /**
   * Initiate Spotify OAuth login
   */
  login: async () => {
    const codeVerifier = generateRandomString(64);

    // Store code verifier for later use
    localStorage.setItem('spotify_code_verifier', codeVerifier);

    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);

    const authUrl = new URL('https://accounts.spotify.com/authorize');

    const params = {
      client_id: SPOTIFY_CLIENT_ID,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      scope: SCOPES,
    };

    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString();
  },

  /**
   * Handle OAuth callback and exchange code for token
   * @param {string} code - Authorization code from callback
   */
  handleCallback: async (code) => {
    const codeVerifier = localStorage.getItem('spotify_code_verifier');

    if (!codeVerifier) {
      throw new Error('Code verifier not found');
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || 'Failed to get access token');
    }

    const data = await response.json();

    // Store tokens
    localStorage.setItem('spotify_access_token', data.access_token);
    localStorage.setItem('spotify_refresh_token', data.refresh_token);
    localStorage.setItem('spotify_token_expiry', Date.now() + data.expires_in * 1000);

    // Clean up code verifier
    localStorage.removeItem('spotify_code_verifier');

    return data.access_token;
  },

  /**
   * Refresh access token using refresh token
   */
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('spotify_refresh_token');

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();

    // Update tokens
    localStorage.setItem('spotify_access_token', data.access_token);
    localStorage.setItem('spotify_token_expiry', Date.now() + data.expires_in * 1000);

    if (data.refresh_token) {
      localStorage.setItem('spotify_refresh_token', data.refresh_token);
    }

    return data.access_token;
  },

  /**
   * Get valid access token (refreshes if expired)
   */
  getAccessToken: async () => {
    const token = localStorage.getItem('spotify_access_token');
    const expiry = localStorage.getItem('spotify_token_expiry');

    if (!token) {
      return null;
    }

    // Check if token is expired (with 5 min buffer)
    if (expiry && Date.now() >= parseInt(expiry) - 300000) {
      try {
        return await spotifyAuth.refreshToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
        spotifyAuth.logout();
        return null;
      }
    }

    return token;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('spotify_access_token');
  },

  /**
   * Logout and clear tokens
   */
  logout: () => {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_token_expiry');
    localStorage.removeItem('spotify_code_verifier');
  },

  /**
   * Get current user's profile
   */
  getCurrentUser: async () => {
    const token = await spotifyAuth.getAccessToken();

    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user profile');
    }

    return await response.json();
  }
};
