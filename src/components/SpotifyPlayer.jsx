import { useState, useEffect, useRef, useCallback } from 'react';
import './SpotifyPlayer.css';

/**
 * SpotifyPlayer Component
 * Uses Spotify Web Playback SDK to create a custom player with full controls
 *
 * Requirements:
 * - User must have Spotify Premium
 * - Requires user authorization with streaming scopes
 * - Load Spotify Web Playback SDK script
 */
const SpotifyPlayer = ({ trackUri, accessToken, onReady, onError, onClipChange }) => {
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const intervalRef = useRef(null);

  // Clip markers state (in milliseconds)
  const [startMarker, setStartMarker] = useState(0);
  const [endMarker, setEndMarker] = useState(30000); // 30 seconds
  const [draggingMarker, setDraggingMarker] = useState(null);
  const progressRef = useRef(null);

  // Load Spotify Web Playback SDK
  useEffect(() => {
    if (!accessToken) return;

    // Check if script already loaded
    if (window.Spotify) {
      initializePlayer();
      return;
    }

    // Load Spotify SDK script
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      initializePlayer();
    };

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [accessToken]);

  const initializePlayer = () => {
    const spotifyPlayer = new window.Spotify.Player({
      name: 'GuessSong Player',
      getOAuthToken: cb => { cb(accessToken); },
      volume: 0.5
    });

    // Error handling
    spotifyPlayer.addListener('initialization_error', ({ message }) => {
      console.error('Initialization Error:', message);
      onError?.(message);
    });

    spotifyPlayer.addListener('authentication_error', ({ message }) => {
      console.error('Authentication Error:', message);
      onError?.(message);
    });

    spotifyPlayer.addListener('account_error', ({ message }) => {
      console.error('Account Error:', message);
      onError?.('Spotify Premium is required for playback');
    });

    spotifyPlayer.addListener('playback_error', ({ message }) => {
      console.error('Playback Error:', message);
      onError?.(message);
    });

    // Playback status updates
    spotifyPlayer.addListener('player_state_changed', state => {
      if (!state) return;

      setCurrentTrack(state.track_window.current_track);
      setIsPlaying(!state.paused);
      setPosition(state.position);
      setDuration(state.duration);
    });

    // Ready
    spotifyPlayer.addListener('ready', ({ device_id }) => {
      console.log('Ready with Device ID', device_id);
      setDeviceId(device_id);
      onReady?.(device_id);
    });

    // Not Ready
    spotifyPlayer.addListener('not_ready', ({ device_id }) => {
      console.log('Device ID has gone offline', device_id);
    });

    // Connect to the player
    spotifyPlayer.connect().then(success => {
      if (success) {
        console.log('Successfully connected to Spotify!');
      }
    });

    setPlayer(spotifyPlayer);
  };

  // Play track when trackUri changes
  useEffect(() => {
    if (!trackUri || !deviceId || !accessToken) return;

    const playTrack = async () => {
      try {
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            uris: [trackUri]
          })
        });
      } catch (error) {
        console.error('Error playing track:', error);
        onError?.(error.message);
      }
    };

    playTrack();
  }, [trackUri, deviceId, accessToken]);

  // Update position every second when playing
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(async () => {
        if (player) {
          const state = await player.getCurrentState();
          if (state) {
            setPosition(state.position);
          }
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, player]);

  const togglePlayPause = () => {
    if (!player) return;

    player.togglePlay().then(() => {
      console.log('Toggled playback');
    });
  };

  const seekToPosition = (newPosition) => {
    if (!player) return;

    player.seek(newPosition).then(() => {
      console.log('Seeked to position:', newPosition);
      setPosition(newPosition);
    });
  };

  const handleProgressClick = (e) => {
    if (draggingMarker) return; // Don't seek while dragging markers
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newPosition = Math.floor(percentage * duration);
    seekToPosition(newPosition);
  };

  // Marker drag handlers
  const handleMarkerMouseDown = (marker, e) => {
    e.stopPropagation();
    setDraggingMarker(marker);
  };

  const handleMouseMove = useCallback((e) => {
    if (!draggingMarker || !progressRef.current || !duration) return;

    const rect = progressRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const time = Math.floor(percentage * duration);

    const CLIP_DURATION = 30000; // 30 seconds in milliseconds

    if (draggingMarker === 'start') {
      const maxStart = Math.min(time, duration - CLIP_DURATION);
      const newStart = Math.max(0, maxStart);
      setStartMarker(newStart);
      setEndMarker(newStart + CLIP_DURATION);
    } else if (draggingMarker === 'end') {
      const minEnd = Math.max(time, CLIP_DURATION);
      const newEnd = Math.min(duration, minEnd);
      setEndMarker(newEnd);
      setStartMarker(newEnd - CLIP_DURATION);
    }
  }, [draggingMarker, duration]);

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

  // Update end marker when duration changes
  useEffect(() => {
    if (duration > 0 && endMarker > duration) {
      setEndMarker(Math.min(duration, 30000));
    }
  }, [duration, endMarker]);

  // Notify parent of clip changes
  useEffect(() => {
    if (onClipChange && duration > 0) {
      onClipChange({
        startTime: startMarker / 1000, // Convert to seconds
        endTime: endMarker / 1000,
        startTimeMs: startMarker,
        endTimeMs: endMarker
      });
    }
  }, [startMarker, endMarker, duration, onClipChange]);

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (player) {
      player.setVolume(newVolume);
    }
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const skipToNext = () => {
    if (!player) return;
    player.nextTrack();
  };

  const skipToPrevious = () => {
    if (!player) return;
    player.previousTrack();
  };

  if (!accessToken) {
    return (
      <div className="spotify-player">
        <div className="player-error">
          Please authenticate with Spotify to use the player
        </div>
      </div>
    );
  }

  return (
    <div className="spotify-player">
      {currentTrack && (
        <div className="player-track-info">
          <img
            src={currentTrack.album.images[0]?.url}
            alt={currentTrack.name}
            className="player-album-art"
          />
          <div className="player-track-details">
            <div className="player-track-name">{currentTrack.name}</div>
            <div className="player-track-artist">
              {currentTrack.artists.map(artist => artist.name).join(', ')}
            </div>
          </div>
        </div>
      )}

      <div className="player-controls">
        <button
          className="control-button"
          onClick={skipToPrevious}
          title="Previous"
        >
          ⏮
        </button>

        <button
          className="control-button play-button"
          onClick={togglePlayPause}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button
          className="control-button"
          onClick={skipToNext}
          title="Next"
        >
          ⏭
        </button>
      </div>

      <div className="player-progress-section">
        <span className="time-display">{formatTime(position)}</span>

        <div
          ref={progressRef}
          className="progress-bar-container"
          onClick={handleProgressClick}
        >
          <div className="progress-bar-bg">
            {/* Clip region highlight */}
            <div
              className="clip-region"
              style={{
                left: `${duration > 0 ? (startMarker / duration) * 100 : 0}%`,
                width: `${duration > 0 ? ((endMarker - startMarker) / duration) * 100 : 0}%`
              }}
            />

            {/* Current position fill */}
            <div
              className="progress-bar-fill"
              style={{ width: `${duration > 0 ? (position / duration) * 100 : 0}%` }}
            />

            {/* Start marker */}
            <div
              className={`clip-marker start-marker ${draggingMarker === 'start' ? 'dragging' : ''}`}
              style={{ left: `${duration > 0 ? (startMarker / duration) * 100 : 0}%` }}
              onMouseDown={(e) => handleMarkerMouseDown('start', e)}
              title={`Start: ${formatTime(startMarker)}`}
            >
              <div className="marker-label">START</div>
              <div className="marker-time">{formatTime(startMarker)}</div>
            </div>

            {/* End marker */}
            <div
              className={`clip-marker end-marker ${draggingMarker === 'end' ? 'dragging' : ''}`}
              style={{ left: `${duration > 0 ? (endMarker / duration) * 100 : 0}%` }}
              onMouseDown={(e) => handleMarkerMouseDown('end', e)}
              title={`End: ${formatTime(endMarker)}`}
            >
              <div className="marker-label">END</div>
              <div className="marker-time">{formatTime(endMarker)}</div>
            </div>
          </div>
        </div>

        <span className="time-display">{formatTime(duration)}</span>
      </div>

      <div className="player-volume-section">
        <span className="volume-icon">🔊</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="volume-slider"
        />
      </div>
    </div>
  );
};

export default SpotifyPlayer;
