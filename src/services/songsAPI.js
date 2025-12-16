import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export const songsAPI = {
  // Get all songs
  getAllSongs: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/songs`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching songs:', error);
      return { success: false, error: error.message };
    }
  },

  // Get single song
  getSong: async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/songs/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching song:', error);
      return { success: false, error: error.message };
    }
  },

  // Create new song
  createSong: async (songData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/songs`, songData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating song:', error);
      return { success: false, error: error.message };
    }
  },

  // Update song
  updateSong: async (id, songData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/songs/${id}`, songData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating song:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete song
  deleteSong: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/songs/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error deleting song:', error);
      return { success: false, error: error.message };
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Backend not reachable:', error);
      return { success: false, error: 'Backend server is not running' };
    }
  }
};

export default songsAPI;
