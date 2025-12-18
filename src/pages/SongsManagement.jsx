import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { songsAPI } from '../services/songsAPI';
import './SongsManagement.css';

const AVAILABLE_TAGS = [
  { name: 'מזרחית', value: 1 },
  { name: 'רוק', value: 2 },
  { name: 'קלאסיקות', value: 4 },
  { name: 'פופ', value: 8 },
  { name: 'היפ הופ', value: 16 },
  { name: 'מסיבות', value: 32 },
  { name: 'שירי אהבה', value: 64 }
];

// Decode tag value to array of tag names
const decodeTagValue = (tagValue) => {
  const value = parseInt(tagValue) || 0;
  return AVAILABLE_TAGS.filter(tag => (value & tag.value) !== 0);
};

// Get tag names as string for display
const getTagNames = (tagValue) => {
  const tags = decodeTagValue(tagValue);
  return tags.map(t => t.name).join(', ');
};

// Format time for input display (seconds under 60, MM:SS for 60+)
const formatTimeInput = (seconds) => {
  const num = parseFloat(seconds);
  if (isNaN(num)) return '';
  if (num < 60) {
    return Math.floor(num).toString();
  }
  const mins = Math.floor(num / 60);
  const secs = Math.floor(num % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Parse time input (accepts both "30" and "1:30" formats)
const parseTimeInput = (value) => {
  if (!value || value === '') return 0;

  // If it contains ':', parse as MM:SS
  if (value.includes(':')) {
    const parts = value.split(':');
    const mins = parseInt(parts[0]) || 0;
    const secs = parseInt(parts[1]) || 0;
    return mins * 60 + secs;
  }

  // Otherwise parse as seconds
  return parseInt(value) || 0;
};

const SongsManagement = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [songs, setSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [showModal, setShowModal] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [formData, setFormData] = useState({
    songTitle: '',
    releaseDate: '',
    views: '',
    difficulty: '',
    youtubeId: '',
    spotifyId: '',
    spotifyUrl: '',
    youtubeUrl: '',
    startCut: '',
    stopCut: '',
    insideOf120: '',
    top30: ''
  });
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);

  const itemsPerPage = 30;

  // Load songs from backend API
  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    const result = await songsAPI.getAllSongs();
    if (result.success) {
      setSongs(result.data);
      setFilteredSongs(result.data);
    } else {
      alert('Failed to load songs from server. Please make sure the backend is running.');
    }
  };

  useEffect(() => {
    let filtered = songs.filter(song =>
      song.songTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply sorting if a column is selected
    if (sortColumn) {
      filtered = sortSongs(filtered, sortColumn, sortDirection);
    }

    setFilteredSongs(filtered);
    setCurrentPage(1); // Reset to page 1 when search changes
  }, [searchTerm, songs, sortColumn, sortDirection]);

  // Helper function to parse views string to number (e.g., "14M" -> 14000000, "110K" -> 110000)
  const parseViews = (viewsStr) => {
    if (!viewsStr) return 0;

    const str = viewsStr.toString().toUpperCase();
    const numValue = parseFloat(str);

    if (str.includes('M')) {
      return numValue * 1000000;
    } else if (str.includes('K')) {
      return numValue * 1000;
    }

    return numValue || 0;
  };

  // Sorting function
  const sortSongs = (songsToSort, column, direction) => {
    const sorted = [...songsToSort].sort((a, b) => {
      let aValue, bValue;

      switch (column) {
        case 'songTitle':
          aValue = a.songTitle.toLowerCase();
          bValue = b.songTitle.toLowerCase();
          break;
        case 'releaseDate':
          aValue = parseInt(a.releaseDate) || 0;
          bValue = parseInt(b.releaseDate) || 0;
          break;
        case 'views':
          aValue = parseViews(a.views);
          bValue = parseViews(b.views);
          break;
        case 'difficulty':
          aValue = a.difficulty;
          bValue = b.difficulty;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  };

  // Handle column header click for sorting
  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Render sort indicator
  const renderSortIndicator = (column) => {
    if (sortColumn !== column) {
      return <span className="sort-indicator">⇅</span>;
    }
    return sortDirection === 'asc'
      ? <span className="sort-indicator active">↑</span>
      : <span className="sort-indicator active">↓</span>;
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredSongs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSongs = filteredSongs.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleEdit = (song) => {
    setEditingSong(song);
    setFormData({
      songTitle: song.songTitle || '',
      releaseDate: song.releaseDate || '',
      views: song.views || '',
      difficulty: song.difficulty || '',
      youtubeId: song.media?.youtubeId || '',
      spotifyId: song.media?.spotifyId || '',
      spotifyUrl: song.spotifyUrl || '',
      youtubeUrl: song.youtubeUrl || '',
      startCut: song.startCut || '',
      stopCut: song.stopCut || '',
      insideOf120: song.insideOf120 || '',
      top30: song.top30 || ''
    });
    // Decode tag value to selected tags array
    setSelectedTags(decodeTagValue(song.tag));
    setShowTagsDropdown(false);
    setShowModal(true);
  };

  const handleDelete = async (songId) => {
    if (window.confirm('Are you sure you want to delete this song?')) {
      const result = await songsAPI.deleteSong(songId);
      if (result.success) {
        setSongs(songs.filter(song => song.songId !== songId));
        alert('Song deleted successfully!');
      } else {
        alert('Failed to delete song. Please try again.');
      }
    }
  };

  // Calculate total tag value from selected tags
  const getTagsValue = () => {
    return selectedTags.reduce((sum, tag) => sum + tag.value, 0);
  };

  // Handle tag toggle in edit modal
  const handleTagToggle = (tag) => {
    setSelectedTags(prev =>
      prev.some(t => t.value === tag.value)
        ? prev.filter(t => t.value !== tag.value)
        : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Update existing song
    const updatedData = {
      songTitle: formData.songTitle,
      releaseDate: formData.releaseDate,
      views: formData.views,
      difficulty: formData.difficulty,
      media: {
        youtubeId: formData.youtubeId,
        spotifyId: formData.spotifyId
      },
      spotifyUrl: formData.spotifyUrl,
      youtubeUrl: formData.youtubeUrl,
      startCut: formData.startCut,
      stopCut: formData.stopCut,
      insideOf120: formData.insideOf120,
      top30: formData.top30,
      tag: getTagsValue().toString()
    };

    const result = await songsAPI.updateSong(editingSong.songId, updatedData);
    if (result.success) {
      setSongs(songs.map(song =>
        song.songId === editingSong.songId ? result.data : song
      ));
      alert('Song updated successfully!');
    } else {
      alert('Failed to update song. Please try again.');
    }

    setShowModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="songs-management-container">
      <header className="songs-header">
        <div className="header-content">
          <h1>Songs Management</h1>
          <div className="user-section">
            <span className="user-name">Welcome, {user?.displayName || user?.email}</span>
            <button onClick={() => navigate('/dashboard')} className="back-button">
              Dashboard
            </button>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="songs-main">
        <div className="songs-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search songs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="songs-stats">
          <p>
            Total Songs: {songs.length} | Showing: {startIndex + 1}-{Math.min(endIndex, filteredSongs.length)} of {filteredSongs.length}
            {searchTerm && ` (filtered)`} | Page {currentPage} of {totalPages}
          </p>
        </div>

        <div className="songs-table-container">
          <table className="songs-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('songTitle')} className="sortable">
                  Song Title {renderSortIndicator('songTitle')}
                </th>
                <th onClick={() => handleSort('releaseDate')} className="sortable">
                  Release Date {renderSortIndicator('releaseDate')}
                </th>
                <th onClick={() => handleSort('views')} className="sortable">
                  Views {renderSortIndicator('views')}
                </th>
                <th onClick={() => handleSort('difficulty')} className="sortable">
                  Difficulty {renderSortIndicator('difficulty')}
                </th>
                <th>YouTube ID</th>
                <th>Spotify ID</th>
                <th>Start</th>
                <th>Stop</th>
                <th>In 120</th>
                <th>Top 30</th>
                <th>Tag</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentSongs.map((song) => (
                <tr key={song.songId || song.uuid}>
                  <td className="song-title">{song.songTitle}</td>
                  <td>{song.releaseDate}</td>
                  <td>{song.views}</td>
                  <td>
                    {song.difficulty && (
                      <span className={`difficulty-badge difficulty-${song.difficulty}`}>
                        {song.difficulty}
                      </span>
                    )}
                  </td>
                  <td className="media-id">{song.media?.youtubeId}</td>
                  <td className="media-id">{song.media?.spotifyId}</td>
                  <td>{song.startCut}</td>
                  <td>{song.stopCut}</td>
                  <td>{song.insideOf120 === 'TRUE' || song.insideOf120 === true ? '✓' : ''}</td>
                  <td>{song.top30 === 'TRUE' || song.top30 === true ? '✓' : ''}</td>
                  <td className="tag-cell">
                    {song.tag && (
                      <span className="tag-display" title={`Value: ${song.tag}`}>
                        {getTagNames(song.tag) || song.tag}
                      </span>
                    )}
                  </td>
                  <td className="actions">
                    <button onClick={() => handleEdit(song)} className="edit-btn">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(song.songId)} className="delete-btn">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              Previous
            </button>

            <div className="pagination-numbers">
              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                  >
                    {page}
                  </button>
                )
              ))}
            </div>

            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Song</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Song Title</label>
                <input
                  type="text"
                  name="songTitle"
                  value={formData.songTitle}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Release Date</label>
                  <input
                    type="text"
                    name="releaseDate"
                    value={formData.releaseDate}
                    onChange={handleChange}
                    placeholder="2024"
                  />
                </div>

                <div className="form-group">
                  <label>Views</label>
                  <input
                    type="text"
                    name="views"
                    value={formData.views}
                    onChange={handleChange}
                    placeholder="1M"
                  />
                </div>

                <div className="form-group">
                  <label>Difficulty</label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleChange}
                  >
                    <option value="">Select difficulty</option>
                    <option value="1">1 - קל</option>
                    <option value="2">2 - בינוני</option>
                    <option value="3">3 - קשה</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>YouTube ID</label>
                  <input
                    type="text"
                    name="youtubeId"
                    value={formData.youtubeId}
                    onChange={handleChange}
                    placeholder="_cubmeyBlGA"
                  />
                </div>

                <div className="form-group">
                  <label>Spotify ID</label>
                  <input
                    type="text"
                    name="spotifyId"
                    value={formData.spotifyId}
                    onChange={handleChange}
                    placeholder="5UEnnrjmKyyReW8OY8FuvN"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>YouTube URL</label>
                <input
                  type="text"
                  name="youtubeUrl"
                  value={formData.youtubeUrl}
                  onChange={handleChange}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div className="form-group">
                <label>Spotify URL</label>
                <input
                  type="text"
                  name="spotifyUrl"
                  value={formData.spotifyUrl}
                  onChange={handleChange}
                  placeholder="https://open.spotify.com/track/..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="text"
                    name="startCut"
                    value={formatTimeInput(formData.startCut)}
                    onChange={(e) => {
                      const val = e.target.value;
                      const parsedSeconds = parseTimeInput(val);
                      setFormData(prev => ({
                        ...prev,
                        startCut: parsedSeconds,
                        stopCut: parsedSeconds + 30
                      }));
                    }}
                    placeholder="30"
                  />
                </div>

                <div className="form-group">
                  <label>End Time (auto +30s)</label>
                  <input
                    type="text"
                    name="stopCut"
                    value={formatTimeInput(formData.stopCut)}
                    disabled
                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="insideOf120"
                      checked={formData.insideOf120 === 'TRUE' || formData.insideOf120 === true}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          insideOf120: e.target.checked ? 'TRUE' : 'FALSE'
                        }));
                      }}
                    />
                    <span>Inside of 120</span>
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="top30"
                      checked={formData.top30 === 'TRUE' || formData.top30 === true}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          top30: e.target.checked ? 'TRUE' : 'FALSE'
                        }));
                      }}
                    />
                    <span>Top 30</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Tags {selectedTags.length > 0 && <span className="tags-value-label">(Value: {getTagsValue()})</span>}</label>
                <div className="tags-selector">
                  <div
                    className="tags-input"
                    onClick={() => setShowTagsDropdown(!showTagsDropdown)}
                  >
                    {selectedTags.length > 0 ? (
                      <div className="selected-tags">
                        {selectedTags.map(tag => (
                          <span key={tag.value} className="tag-chip">
                            {tag.name}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTagToggle(tag);
                              }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="placeholder">Select tags...</span>
                    )}
                  </div>

                  {showTagsDropdown && (
                    <div className="tags-dropdown">
                      {AVAILABLE_TAGS.map(tag => (
                        <div
                          key={tag.value}
                          className={`tag-option ${selectedTags.some(t => t.value === tag.value) ? 'selected' : ''}`}
                          onClick={() => handleTagToggle(tag)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedTags.some(t => t.value === tag.value)}
                            readOnly
                          />
                          <span>{tag.name}</span>
                          <span className="tag-value-badge">{tag.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Update Song
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SongsManagement;
