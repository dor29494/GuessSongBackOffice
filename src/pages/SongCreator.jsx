import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { youtubeAPI } from '../services/youtubeAPI';
import { spotifyAPI } from '../services/spotifyAPI';
import { songsAPI } from '../services/songsAPI';
import './SongCreator.css';

const AVAILABLE_TAGS = [
  { name: 'מזרחית', value: 1 },
  { name: 'רוק', value: 2 },
  { name: 'קלאסיקות', value: 4 },
  { name: 'פופ', value: 8 },
  { name: 'היפ הופ', value: 16 },
  { name: 'מסיבות', value: 32 },
  { name: 'שירי אהבה', value: 64 }
];

// Format view count to human readable format (e.g., 2.4M, 150K)
const formatViewCount = (count) => {
  const num = parseInt(count);
  if (isNaN(num)) return '';

  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
};

const SongCreator = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const timelineRef = useRef(null);

  // YouTube search state
  const [youtubeSearchTerm, setYoutubeSearchTerm] = useState('');
  const [youtubeResults, setYoutubeResults] = useState([]);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [showYoutubeDropdown, setShowYoutubeDropdown] = useState(false);
  const [youtubeSelected, setYoutubeSelected] = useState(false); // Flag to prevent dropdown after selection

  // Selected YouTube video
  const [selectedYoutubeVideo, setSelectedYoutubeVideo] = useState(null);
  const [youtubeId, setYoutubeId] = useState('');

  // Song form data
  const [songTitle, setSongTitle] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [views, setViews] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [insideOf120, setInsideOf120] = useState(false);
  const [top30, setTop30] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);

  // Spotify state
  const [spotifySearchTerm, setSpotifySearchTerm] = useState('');
  const [spotifyResults, setSpotifyResults] = useState([]);
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [showSpotifyDropdown, setShowSpotifyDropdown] = useState(false);
  const [selectedSpotifyTrack, setSelectedSpotifyTrack] = useState(null);
  const [spotifyId, setSpotifyId] = useState('');
  const [spotifySelected, setSpotifySelected] = useState(false); // Flag to prevent dropdown after selection

  // Spotify Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30); // Spotify preview is 30 seconds

  // Time points for clip
  const [startTime, setStartTime] = useState(0);
  const [stopTime, setStopTime] = useState(30);
  const [draggingMarker, setDraggingMarker] = useState(null);

  // Saving state
  const [saving, setSaving] = useState(false);

  // YouTube search with debounce
  useEffect(() => {
    // Skip search if a video was just selected
    if (youtubeSelected) {
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      if (youtubeSearchTerm.trim().length >= 2) {
        setYoutubeLoading(true);
        try {
          const result = await youtubeAPI.searchVideos(youtubeSearchTerm, 8);
          if (result.success) {
            setYoutubeResults(result.data);
            setShowYoutubeDropdown(true);
          }
        } catch (error) {
          console.error('YouTube search error:', error);
        } finally {
          setYoutubeLoading(false);
        }
      } else {
        setYoutubeResults([]);
        setShowYoutubeDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [youtubeSearchTerm, youtubeSelected]);

  // Spotify search with debounce
  useEffect(() => {
    // Skip search if a track was just selected
    if (spotifySelected) {
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      if (spotifySearchTerm.trim().length >= 2) {
        setSpotifyLoading(true);
        try {
          const result = await spotifyAPI.searchTracks(spotifySearchTerm, 5);
          if (result.success) {
            setSpotifyResults(result.data);
            setShowSpotifyDropdown(true);
          }
        } catch (error) {
          console.error('Spotify search error:', error);
        } finally {
          setSpotifyLoading(false);
        }
      } else {
        setSpotifyResults([]);
        setShowSpotifyDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [spotifySearchTerm, spotifySelected]);

  // Update audio current time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      // Auto-stop at stopTime
      if (audio.currentTime >= stopTime) {
        audio.pause();
        setIsPlaying(false);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setStopTime(Math.min(30, audio.duration));
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [stopTime]);

  // Timeline click handler
  const handleTimelineClick = (e) => {
    if (!timelineRef.current || !duration) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;

    // Seek to clicked position
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Marker drag handlers
  const handleMarkerMouseDown = (marker, e) => {
    e.stopPropagation();
    setDraggingMarker(marker);
  };

  const handleMouseMove = useCallback((e) => {
    if (!draggingMarker || !timelineRef.current || !duration) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const time = Math.round(percentage * duration * 10) / 10; // Round to 0.1 sec

    if (draggingMarker === 'start') {
      setStartTime(Math.max(0, Math.min(time, stopTime - 1)));
    } else {
      setStopTime(Math.min(duration, Math.max(time, startTime + 1)));
    }
  }, [draggingMarker, duration, startTime, stopTime]);

  const handleMouseUp = useCallback(() => {
    setDraggingMarker(null);
  }, []);

  // Add/remove mouse event listeners for dragging
  useEffect(() => {
    if (draggingMarker) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingMarker, handleMouseMove, handleMouseUp]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleYoutubeSelect = async (video) => {
    // Set flag to prevent dropdown from reopening
    setYoutubeSelected(true);
    setSelectedYoutubeVideo(video);
    setYoutubeId(video.id.videoId);
    setYoutubeSearchTerm(video.snippet.title);
    setShowYoutubeDropdown(false);
    setYoutubeResults([]);

    // Auto-fill song title from YouTube video
    if (!songTitle) {
      setSongTitle(video.snippet.title);
    }

    // Fetch video details to get view count
    try {
      const detailsResult = await youtubeAPI.getVideoDetails(video.id.videoId);
      if (detailsResult.success && detailsResult.data) {
        const viewCount = detailsResult.data.statistics?.viewCount;
        if (viewCount) {
          setViews(formatViewCount(viewCount));
        }
      }
    } catch (error) {
      console.error('Error fetching video details:', error);
    }

    // Auto-search Spotify with the song title
    const searchQuery = video.snippet.title;
    // Set flag BEFORE changing search term to prevent the useEffect from triggering
    setSpotifySelected(true);
    setSpotifyLoading(true);
    try {
      const result = await spotifyAPI.searchTracks(searchQuery, 10); // Get more results to find one with preview
      if (result.success && result.data.length > 0) {
        // Try to find a track with preview_url, otherwise use first result
        const trackWithPreview = result.data.find(track => track.preview_url);
        const selectedTrack = trackWithPreview || result.data[0];

        setSelectedSpotifyTrack(selectedTrack);
        setSpotifyId(selectedTrack.id);
        setSpotifySearchTerm(`${selectedTrack.name} - ${selectedTrack.artists.map(a => a.name).join(', ')}`);
        setShowSpotifyDropdown(false);
        setSpotifyResults([]);

        // Reset player state
        setCurrentTime(0);
        setStartTime(0);
        setIsPlaying(false);
        if (selectedTrack.preview_url) {
          setDuration(30);
          setStopTime(30);
        }
      } else {
        // No results found, allow manual search
        setSpotifySelected(false);
        setSpotifySearchTerm(searchQuery);
        setSpotifyResults(result.data || []);
        if (result.data?.length > 0) {
          setShowSpotifyDropdown(true);
        }
      }
    } catch (error) {
      console.error('Spotify auto-search error:', error);
      setSpotifySelected(false);
    } finally {
      setSpotifyLoading(false);
    }
  };

  const handleSpotifySelect = (track) => {
    // Set flag to prevent dropdown from reopening
    setSpotifySelected(true);
    setSelectedSpotifyTrack(track);
    setSpotifyId(track.id);
    setSpotifySearchTerm(`${track.name} - ${track.artists.map(a => a.name).join(', ')}`);
    setShowSpotifyDropdown(false);
    setSpotifyResults([]);

    // Reset player state
    setCurrentTime(0);
    setStartTime(0);
    setIsPlaying(false);

    // Set duration based on preview (usually 30 seconds)
    if (track.preview_url) {
      setDuration(30);
      setStopTime(30);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.currentTime = startTime;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePreviewClip = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = startTime;
    audioRef.current.play();
    setIsPlaying(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTagToggle = (tag) => {
    setSelectedTags(prev =>
      prev.some(t => t.value === tag.value)
        ? prev.filter(t => t.value !== tag.value)
        : [...prev, tag]
    );
  };

  // Calculate total tag value (sum of all selected tag values)
  const getTagsValue = () => {
    return selectedTags.reduce((sum, tag) => sum + tag.value, 0);
  };

  const handleSaveSong = async () => {
    if (!youtubeId) {
      alert('Please select a YouTube video');
      return;
    }

    if (!songTitle.trim()) {
      alert('Please enter a song title');
      return;
    }

    setSaving(true);

    const songData = {
      songTitle: songTitle.trim(),
      releaseDate: releaseDate,
      views: views,
      difficulty: difficulty,
      media: {
        youtubeId: youtubeId,
        spotifyId: spotifyId
      },
      youtubeUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
      spotifyUrl: selectedSpotifyTrack ? selectedSpotifyTrack.external_urls.spotify : '',
      startCut: startTime.toString(),
      stopCut: stopTime.toString(),
      insideOf120: insideOf120 ? 'TRUE' : '',
      top30: top30 ? 'TRUE' : '',
      tag: getTagsValue().toString()
    };

    try {
      const result = await songsAPI.createSong(songData);
      if (result.success) {
        alert('Song created successfully!');
        resetForm();
      } else {
        alert('Failed to create song: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving song:', error);
      alert('Failed to save song. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setYoutubeSearchTerm('');
    setYoutubeResults([]);
    setSelectedYoutubeVideo(null);
    setYoutubeId('');
    setYoutubeSelected(false);
    setSongTitle('');
    setReleaseDate('');
    setViews('');
    setDifficulty('');
    setInsideOf120(false);
    setTop30(false);
    setSelectedTags([]);
    setSpotifySearchTerm('');
    setSpotifyResults([]);
    setSelectedSpotifyTrack(null);
    setSpotifyId('');
    setSpotifySelected(false);
    setStartTime(0);
    setStopTime(30);
    setCurrentTime(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  return (
    <div className="song-creator-container">
      <header className="song-creator-header">
        <div className="header-content">
          <h1>Song Creator</h1>
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

      <main className="song-creator-main">
        {/* YouTube Section */}
        <section className="creator-section youtube-section">
          <h2>1. Search YouTube</h2>

          <div className="autocomplete-container">
            <input
              type="text"
              placeholder="Search for a song on YouTube..."
              value={youtubeSearchTerm}
              onChange={(e) => {
                setYoutubeSearchTerm(e.target.value);
                // Reset selection flag when user types to allow new searches
                if (youtubeSelected) {
                  setYoutubeSelected(false);
                  setSelectedYoutubeVideo(null);
                  setYoutubeId('');
                }
              }}
              onFocus={() => youtubeResults.length > 0 && !youtubeSelected && setShowYoutubeDropdown(true)}
              className="search-input"
            />
            {youtubeLoading && <span className="loading-indicator">Searching...</span>}

            {showYoutubeDropdown && youtubeResults.length > 0 && (
              <div className="autocomplete-dropdown">
                {youtubeResults.map((video) => (
                  <div
                    key={video.id.videoId}
                    className="autocomplete-item"
                    onClick={() => handleYoutubeSelect(video)}
                  >
                    <img src={video.snippet.thumbnails.default.url} alt="" />
                    <div className="autocomplete-info">
                      <span className="autocomplete-title">{video.snippet.title}</span>
                      <span className="autocomplete-channel">{video.snippet.channelTitle}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedYoutubeVideo && (
            <div className="selected-video-card">
              <img
                src={selectedYoutubeVideo.snippet.thumbnails.medium?.url || selectedYoutubeVideo.snippet.thumbnails.default.url}
                alt={selectedYoutubeVideo.snippet.title}
                className="selected-thumbnail"
              />
              <div className="selected-video-details">
                <h3>{selectedYoutubeVideo.snippet.title}</h3>
                <p>{selectedYoutubeVideo.snippet.channelTitle}</p>
                <span className="youtube-id-badge">ID: {youtubeId}</span>
              </div>
            </div>
          )}
        </section>

        {/* Song Details Form */}
        <section className="creator-section form-section">
          <h2>2. Song Details</h2>

          <div className="form-grid">
            <div className="form-group full-width">
              <label>Song Title *</label>
              <input
                type="text"
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                placeholder="Enter song title"
              />
            </div>

            <div className="form-group">
              <label>Release Date</label>
              <input
                type="text"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                placeholder="e.g., 2024"
              />
            </div>

            <div className="form-group">
              <label>Views</label>
              <input
                type="text"
                value={views}
                onChange={(e) => setViews(e.target.value)}
                placeholder="Auto-filled from YouTube"
              />
            </div>

            <div className="form-group">
              <label>Difficulty (1-5)</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="">Select difficulty</option>
                <option value="1">1 - Very Easy</option>
                <option value="2">2 - Easy</option>
                <option value="3">3 - Medium</option>
                <option value="4">4 - Hard</option>
                <option value="5">5 - Very Hard</option>
              </select>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={insideOf120}
                  onChange={(e) => setInsideOf120(e.target.checked)}
                />
                <span>Inside of 120</span>
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={top30}
                  onChange={(e) => setTop30(e.target.checked)}
                />
                <span>Top 30</span>
              </label>
            </div>

            <div className="form-group full-width">
              <label>Tags {selectedTags.length > 0 && <span className="tags-value">(Value: {getTagsValue()})</span>}</label>
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
          </div>
        </section>

        {/* Spotify Section */}
        <section className="creator-section spotify-section">
          <h2>3. Search Spotify & Set Clip Points</h2>

          <div className="autocomplete-container">
            <input
              type="text"
              placeholder="Search for a song on Spotify..."
              value={spotifySearchTerm}
              onChange={(e) => {
                setSpotifySearchTerm(e.target.value);
                // Reset selection flag when user types to allow new searches
                if (spotifySelected) {
                  setSpotifySelected(false);
                  setSelectedSpotifyTrack(null);
                  setSpotifyId('');
                }
              }}
              onFocus={() => spotifyResults.length > 0 && !spotifySelected && setShowSpotifyDropdown(true)}
              className="search-input spotify-input"
            />
            {spotifyLoading && <span className="loading-indicator">Searching...</span>}

            {showSpotifyDropdown && spotifyResults.length > 0 && (
              <div className="autocomplete-dropdown spotify-dropdown">
                {spotifyResults.map((track) => (
                  <div
                    key={track.id}
                    className="autocomplete-item spotify-item"
                    onClick={() => handleSpotifySelect(track)}
                  >
                    <img src={track.album.images[2]?.url || track.album.images[0]?.url} alt="" />
                    <div className="autocomplete-info">
                      <span className="autocomplete-title">{track.name}</span>
                      <span className="autocomplete-channel">
                        {track.artists.map(a => a.name).join(', ')} • {track.album.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedSpotifyTrack && (
            <div className="spotify-player-section">
              {/* Spotify Embed Player */}
              <div className="spotify-embed-container">
                <iframe
                  src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`}
                  width="100%"
                  height="152"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  title="Spotify Player"
                  className="spotify-embed"
                />
              </div>

              <div className="track-info-bar">
                <span className="spotify-id-badge">Spotify ID: {spotifyId}</span>
              </div>

              {/* Clip Points Input */}
              <div className="clip-points-section">
                <h4>Set Clip Points (in seconds)</h4>
                <div className="clip-inputs">
                  <div className="clip-input-group">
                    <label>Start Time:</label>
                    <input
                      type="number"
                      value={startTime}
                      onChange={(e) => setStartTime(Math.max(0, parseFloat(e.target.value) || 0))}
                      min="0"
                      step="0.1"
                      placeholder="0"
                    />
                    <span className="clip-formatted">{formatTime(startTime)}</span>
                  </div>
                  <div className="clip-input-group">
                    <label>Stop Time:</label>
                    <input
                      type="number"
                      value={stopTime}
                      onChange={(e) => setStopTime(Math.max(startTime + 1, parseFloat(e.target.value) || 0))}
                      min={startTime + 1}
                      step="0.1"
                      placeholder="30"
                    />
                    <span className="clip-formatted">{formatTime(stopTime)}</span>
                  </div>
                  <div className="clip-duration-display">
                    Clip Duration: {formatTime(stopTime - startTime)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Save Button */}
        <div className="save-section">
          <button
            onClick={handleSaveSong}
            className="save-button"
            disabled={saving || !youtubeId || !songTitle.trim()}
          >
            {saving ? 'Saving...' : 'Save Song'}
          </button>
          <button
            onClick={resetForm}
            className="reset-button"
            type="button"
          >
            Reset Form
          </button>
        </div>
      </main>

      {/* Click outside handler for dropdowns */}
      {(showYoutubeDropdown || showSpotifyDropdown || showTagsDropdown) && (
        <div
          className="dropdown-overlay"
          onClick={() => {
            setShowYoutubeDropdown(false);
            setShowSpotifyDropdown(false);
            setShowTagsDropdown(false);
          }}
        />
      )}
    </div>
  );
};

export default SongCreator;
