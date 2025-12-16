import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>GuessSong Backoffice</h1>
          <div className="user-section">
            <span className="user-name">Welcome, {user?.name || user?.email}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="welcome-card">
            <h2>Welcome to GuessSong Backoffice</h2>
            <p>You are successfully logged in!</p>
            <div className="user-info">
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Name:</strong> {user?.name || 'Not set'}</p>
            </div>
          </div>

          <div className="quick-links">
            <h3>Quick Links</h3>
            <div className="links-grid">
              <div className="link-card">
                <h4>Song Creator</h4>
                <p>Create new songs with YouTube and Spotify</p>
                <button onClick={() => navigate('/song-creator')} className="link-button active">
                  Create Song
                </button>
              </div>
              <div className="link-card">
                <h4>Songs Management</h4>
                <p>Manage your song library</p>
                <button onClick={() => navigate('/songs')} className="link-button active">
                  Go to Songs
                </button>
              </div>
              <div className="link-card">
                <h4>Users</h4>
                <p>Manage system users</p>
                <button className="link-button">Coming Soon</button>
              </div>
              <div className="link-card">
                <h4>Analytics</h4>
                <p>View statistics and reports</p>
                <button className="link-button">Coming Soon</button>
              </div>
              <div className="link-card">
                <h4>Settings</h4>
                <p>Configure system settings</p>
                <button className="link-button">Coming Soon</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
