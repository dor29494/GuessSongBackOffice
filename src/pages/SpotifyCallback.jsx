import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { spotifyAuth } from '../services/spotifyAuth';

/**
 * Spotify OAuth Callback Handler
 * Processes the authorization code and exchanges it for access token
 */
const SpotifyCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setError(`Authentication failed: ${error}`);
        setTimeout(() => navigate('/song-creator'), 3000);
        return;
      }

      if (!code) {
        setError('No authorization code received');
        setTimeout(() => navigate('/song-creator'), 3000);
        return;
      }

      try {
        setStatus('Exchanging authorization code for access token...');
        await spotifyAuth.handleCallback(code);
        setStatus('Success! Redirecting...');

        // Redirect back to song creator
        setTimeout(() => {
          navigate('/song-creator', { state: { spotifyAuthenticated: true } });
        }, 1000);
      } catch (err) {
        console.error('Callback error:', err);
        setError(err.message);
        setTimeout(() => navigate('/song-creator'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h2>Spotify Authentication</h2>

      {error ? (
        <div style={{
          padding: '20px',
          backgroundColor: '#fee',
          borderRadius: '8px',
          color: '#c00',
          marginTop: '20px'
        }}>
          <p>{error}</p>
          <p style={{ fontSize: '14px', marginTop: '10px' }}>
            Redirecting back to Song Creator...
          </p>
        </div>
      ) : (
        <div style={{
          padding: '20px',
          backgroundColor: '#efe',
          borderRadius: '8px',
          color: '#060',
          marginTop: '20px'
        }}>
          <p>{status}</p>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #060',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '20px auto'
          }}></div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default SpotifyCallback;
