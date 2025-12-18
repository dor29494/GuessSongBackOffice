// YouTube Data API v3 Service
// Now using Cloudflare Pages Functions for secure server-side API calls

export const youtubeAPI = {
  /**
   * Search for videos on YouTube using server-side Cloudflare Function
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum number of results (default: 10)
   * @returns {Promise<Object>} Search results
   */
  searchVideos: async (query, maxResults = 10) => {
    try {
      const params = new URLSearchParams({
        q: query,
        maxResults: maxResults.toString()
      });

      // Call the Cloudflare Pages Function endpoint
      const response = await fetch(`/api/youtube-search?${params}`);

      if (!response.ok) {
        throw new Error('YouTube API request failed');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'YouTube search failed');
      }

      return {
        success: true,
        data: data.data || []
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
   * Get video details by ID using server-side Cloudflare Function
   * @param {string} videoId - YouTube video ID
   * @returns {Promise<Object>} Video details
   */
  getVideoDetails: async (videoId) => {
    try {
      const params = new URLSearchParams({
        id: videoId
      });

      // Call the Cloudflare Pages Function endpoint
      const response = await fetch(`/api/youtube-video?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch video details');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get video details');
      }

      return {
        success: true,
        data: data.data
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
