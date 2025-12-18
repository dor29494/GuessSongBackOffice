// YouTube Data API v3 Service
// Using API key directly from environment variables

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

export const youtubeAPI = {
  /**
   * Search for videos on YouTube
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum number of results (default: 10)
   * @returns {Promise<Object>} Search results
   */
  searchVideos: async (query, maxResults = 10) => {
    if (!YOUTUBE_API_KEY) {
      console.error('YouTube API key is not configured');
      return {
        success: false,
        error: 'YouTube API key not configured. Please check your .env file'
      };
    }

    try {
      const params = new URLSearchParams({
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: maxResults.toString(),
        key: YOUTUBE_API_KEY,
        videoCategoryId: '10' // Music category
      });

      const response = await fetch(`${YOUTUBE_API_BASE_URL}/search?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'YouTube API request failed');
      }

      const data = await response.json();

      return {
        success: true,
        data: data.items || []
      };
    } catch (error) {
      console.error('YouTube API error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Get video details by ID
   * @param {string} videoId - YouTube video ID
   * @returns {Promise<Object>} Video details
   */
  getVideoDetails: async (videoId) => {
    if (!YOUTUBE_API_KEY) {
      console.error('YouTube API key is not configured');
      return {
        success: false,
        error: 'YouTube API key not configured'
      };
    }

    try {
      const params = new URLSearchParams({
        part: 'snippet,contentDetails,statistics',
        id: videoId,
        key: YOUTUBE_API_KEY
      });

      const response = await fetch(`${YOUTUBE_API_BASE_URL}/videos?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch video details');
      }

      const data = await response.json();

      return {
        success: true,
        data: data.items?.[0] || null
      };
    } catch (error) {
      console.error('YouTube API error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};
