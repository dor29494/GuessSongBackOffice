# Spotify Web Playback SDK Integration Guide

This guide shows how to integrate the custom Spotify player into your SongCreator component.

## Prerequisites

### 1. Update Spotify App Settings
Go to your [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and add the following to your app's Redirect URIs:
```
http://localhost:5173/callback
http://localhost:3000/callback
https://yourdomain.com/callback
```

### 2. User Requirements
- **Spotify Premium account required** - The Web Playback SDK only works with Premium accounts
- Users must authorize the application with streaming permissions

## Integration Steps

### Step 1: Add Authentication Button to SongCreator

Add this state and button to your SongCreator component:

```jsx
import { spotifyAuth } from '../services/spotifyAuth';
import SpotifyPlayer from '../components/SpotifyPlayer';

// Add these state variables
const [spotifyAccessToken, setSpotifyAccessToken] = useState(null);
const [isSpotifyAuthenticated, setIsSpotifyAuthenticated] = useState(false);
const [playerDeviceId, setPlayerDeviceId] = useState(null);

// Check authentication on mount
useEffect(() => {
  const checkAuth = async () => {
    if (spotifyAuth.isAuthenticated()) {
      const token = await spotifyAuth.getAccessToken();
      setSpotifyAccessToken(token);
      setIsSpotifyAuthenticated(true);
    }
  };
  checkAuth();
}, []);

// Add login handler
const handleSpotifyLogin = () => {
  spotifyAuth.login();
};

// Add logout handler
const handleSpotifyLogout = () => {
  spotifyAuth.logout();
  setSpotifyAccessToken(null);
  setIsSpotifyAuthenticated(false);
  setPlayerDeviceId(null);
};
```

### Step 2: Add Authentication UI

Replace the Spotify embed section with this:

```jsx
{selectedSpotifyTrack && (
  <div className="spotify-player-section">
    {!isSpotifyAuthenticated ? (
      <div className="spotify-auth-prompt">
        <p>To use the interactive Spotify player, please authenticate:</p>
        <button onClick={handleSpotifyLogin} className="spotify-login-button">
          Login with Spotify
        </button>
        <p className="spotify-note">
          Note: Requires Spotify Premium account
        </p>
      </div>
    ) : (
      <>
        <div className="spotify-auth-status">
          <span>✓ Authenticated with Spotify</span>
          <button onClick={handleSpotifyLogout} className="spotify-logout-button">
            Logout
          </button>
        </div>

        <SpotifyPlayer
          trackUri={`spotify:track:${spotifyId}`}
          accessToken={spotifyAccessToken}
          onReady={(deviceId) => {
            console.log('Player ready with device:', deviceId);
            setPlayerDeviceId(deviceId);
          }}
          onError={(error) => {
            console.error('Player error:', error);
            alert(`Player error: ${error}`);
          }}
          onClipChange={(clipData) => {
            // Update your form's start/stop times
            setStartTime(clipData.startTime);
            setStopTime(clipData.endTime);
            console.log('Clip updated:', clipData);
          }}
        />
      </>
    )}

    <div className="track-info-bar">
      <span className="spotify-id-badge">Spotify ID: {spotifyId}</span>
    </div>

    {/* Clip Points Section - Keep existing code */}
    <div className="clip-points-section">
      <h4>Set Clip Points (in seconds)</h4>
      {/* ... existing clip points code ... */}
    </div>
  </div>
)}
```

### Step 3: Add CSS for New Elements

Add to `SongCreator.css`:

```css
.spotify-auth-prompt {
  background: linear-gradient(135deg, #1db954 0%, #191414 100%);
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  color: white;
  margin-bottom: 20px;
}

.spotify-login-button {
  background: #1db954;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  margin: 15px 0;
  transition: all 0.3s ease;
}

.spotify-login-button:hover {
  background: #1ed760;
  transform: scale(1.05);
  box-shadow: 0 4px 20px rgba(29, 185, 84, 0.4);
}

.spotify-note {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 10px;
}

.spotify-auth-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: rgba(29, 185, 84, 0.1);
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #1db954;
}

.spotify-auth-status span {
  color: #1db954;
  font-weight: bold;
}

.spotify-logout-button {
  background: transparent;
  border: 1px solid #666;
  color: #666;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.spotify-logout-button:hover {
  background: #f44336;
  color: white;
  border-color: #f44336;
}
```

## Alternative: Simpler Audio Element Player

If you don't need the full Web Playback SDK and are okay with just preview URLs (30 seconds), you can create a simpler custom player:

```jsx
// Simple custom preview player (no Premium required)
const SimpleSpotifyPlayer = ({ previewUrl }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;
    audioRef.current.currentTime = time;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!previewUrl) {
    return <div className="no-preview">No preview available</div>;
  }

  return (
    <div className="simple-player">
      <audio ref={audioRef} src={previewUrl} />

      <button className="play-btn" onClick={togglePlay}>
        {isPlaying ? '⏸' : '▶'}
      </button>

      <div className="progress-section">
        <span>{formatTime(currentTime)}</span>
        <div className="progress-bar" onClick={handleProgressClick}>
          <div
            className="progress-fill"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};
```

## 🎯 New Feature: Clip Markers

The SpotifyPlayer component now includes **draggable clip markers** for selecting 30-second segments:

```
Progress Bar with Clip Markers:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ┃ START              END ┃
     0:45                   1:15
       └────── 30s clip ──────┘
         (Green highlighted region)
```

### Features:
- **Two draggable markers**: START (green) and END (red)
- **Fixed 30-second duration**: Markers maintain exactly 30 seconds apart
- **Visual clip region**: Highlighted area shows the selected clip
- **Real-time updates**: Clip times update as you drag
- **Callback support**: `onClipChange` prop receives updated times

### How It Works:
1. Drag the **START marker** (green) to set where the clip begins
2. Drag the **END marker** (red) to set where the clip ends
3. The markers automatically maintain a 30-second gap
4. The highlighted region shows your selected clip
5. Clip times are displayed below the progress bar

### Callback Data:
```javascript
onClipChange={(clipData) => {
  console.log(clipData.startTime);    // Start in seconds (e.g., 45.5)
  console.log(clipData.endTime);      // End in seconds (e.g., 75.5)
  console.log(clipData.startTimeMs);  // Start in milliseconds
  console.log(clipData.endTimeMs);    // End in milliseconds
}}
```

## Key Differences

| Feature | Web Playback SDK | Audio Element (Preview) |
|---------|------------------|-------------------------|
| Full track playback | ✅ Yes | ❌ No (30s only) |
| Requires Premium | ✅ Yes | ❌ No |
| User OAuth | ✅ Required | ❌ Not needed |
| Seek anywhere | ✅ Yes | ✅ Yes (in 30s) |
| Volume control | ✅ Yes | ✅ Yes |
| Skip tracks | ✅ Yes | ❌ No |
| **Clip Markers** | ✅ Yes (drag anywhere) | ✅ Yes (limited to 30s) |
| Complexity | High | Low |

## Recommended Approach

For your use case (setting clip points), I recommend:

1. **Use the simple Audio Element player** with preview URLs for most users
2. **Optionally offer Web Playback SDK** for Premium users who want full track access

This gives you the best of both worlds without forcing all users to have Premium accounts.

## Troubleshooting

### "Account Error: Spotify Premium Required"
- User needs to upgrade to Spotify Premium
- Alternatively, use the simple audio preview player

### "Authentication Error"
- Check that Redirect URI is correctly set in Spotify Dashboard
- Verify Client ID in `.env` file
- Clear localStorage and try again

### "Playback Error"
- Ensure track is available in user's region
- Check that track URI format is correct: `spotify:track:TRACK_ID`
- Verify access token has required scopes

### Player Not Loading
- Check browser console for errors
- Verify Spotify SDK script is loading
- Ensure HTTPS in production (required for Web Playback SDK)

## Next Steps

Choose one of these approaches:
1. **Quick & Simple**: Just style the existing HTML audio element you already have
2. **Preview Player**: Use the SimpleSpotifyPlayer for better UI without Premium requirement
3. **Full Player**: Use the SpotifyPlayer component for Premium users with full track access

Let me know which approach you'd like to pursue!
