import { useState } from 'react'
import './UserDashboard.css'

export default function UserDashboard({ user, onLogout }) {
  const [showProfile, setShowProfile] = useState(false)

  return (
    <div className="user-container">
      <div className="user-header">
        <h1>Welcome, {user.username}!</h1>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </div>

      <div className="user-content">
        <div className="welcome-card">
          <h2>Health Check</h2>
          <p>Status: ✓ All systems operational</p>
        </div>

        <div className="profile-section">
          <button 
            className="profile-toggle"
            onClick={() => setShowProfile(!showProfile)}
          >
            {showProfile ? 'Hide Profile' : 'View Profile'}
          </button>

          {showProfile && (
            <div className="profile-card">
              <h3>Your Profile</h3>
              <div className="profile-info">
                <div className="info-row">
                  <span className="label">Username:</span>
                  <span className="value">{user.username}</span>
                </div>
                <div className="info-row">
                  <span className="label">Email:</span>
                  <span className="value">{user.email}</span>
                </div>
                <div className="info-row">
                  <span className="label">Account Type:</span>
                  <span className="value">
                    <span className="badge user-badge">User</span>
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">User ID:</span>
                  <span className="value mono">{user.id}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="features-section">
          <h2>Available Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h4>📊 Dashboard</h4>
              <p>View your personal dashboard and statistics</p>
            </div>
            <div className="feature-card">
              <h4>👤 Profile</h4>
              <p>Manage your profile information</p>
            </div>
            <div className="feature-card">
              <h4>⚙️ Settings</h4>
              <p>Configure your account preferences</p>
            </div>
            <div className="feature-card">
              <h4>🔒 Security</h4>
              <p>Keep your account secure</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
