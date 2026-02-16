import { useState } from 'react'
import Logo from './Logo'
import './UserDashboard.css'

export default function UserDashboard({ user, onLogout }) {
  const [activeView, setActiveView] = useState('dashboard')
  const [showProfile, setShowProfile] = useState(false)

  return (
    <div className="user-container">
      <div className="user-header">
        <div className="header-left">
          <Logo />
          <h1>Welcome, {user.username}!</h1>
        </div>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </div>

      {/* Navigation Tabs */}
      <div className="user-nav">
        <button 
          className={`nav-tab ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveView('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`nav-tab ${activeView === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveView('profile')}
        >
          👤 Profile
        </button>
        <button 
          className={`nav-tab ${activeView === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveView('settings')}
        >
          ⚙️ Settings
        </button>
        <button 
          className={`nav-tab ${activeView === 'security' ? 'active' : ''}`}
          onClick={() => setActiveView('security')}
        >
          🔒 Security
        </button>
      </div>

      <div className="user-content">
        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <div className="view-container">
            <div className="welcome-card">
              <h2>📊 Dashboard</h2>
              <p>Status: ✓ All systems operational</p>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Account Status</h3>
                  <p className="stat-value">✓ Active</p>
                </div>
                <div className="stat-card">
                  <h3>Role</h3>
                  <p className="stat-value">Security Guard</p>
                </div>
                <div className="stat-card">
                  <h3>Member Since</h3>
                  <p className="stat-value">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="stat-card">
                  <h3>Verification</h3>
                  <p className="stat-value">{user.verified ? '✓ Verified' : 'Pending'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile View */}
        {activeView === 'profile' && (
          <div className="view-container">
            <div className="profile-card">
              <h2>👤 Your Profile</h2>
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
                  <span className="label">Full Name:</span>
                  <span className="value">{user.fullName || 'Not set'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Phone Number:</span>
                  <span className="value">{user.phoneNumber || 'Not set'}</span>
                </div>
                <div className="info-row">
                  <span className="label">License Number:</span>
                  <span className="value">{user.licenseNumber || 'Not set'}</span>
                </div>
                <div className="info-row">
                  <span className="label">License Expiry:</span>
                  <span className="value">
                    {user.licenseExpiryDate ? new Date(user.licenseExpiryDate).toLocaleDateString() : 'Not set'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Account Type:</span>
                  <span className="value">
                    <span className="badge user-badge">User (Security Guard)</span>
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">User ID:</span>
                  <span className="value mono">{user.id}</span>
                </div>
              </div>
              <button className="edit-btn">✏️ Edit Profile</button>
            </div>
          </div>
        )}

        {/* Settings View */}
        {activeView === 'settings' && (
          <div className="view-container">
            <div className="settings-card">
              <h2>⚙️ Settings</h2>
              
              <div className="settings-section">
                <h3>Notifications</h3>
                <div className="settings-row">
                  <label>
                    <input type="checkbox" defaultChecked />
                    <span>Receive shift reminders via email</span>
                  </label>
                </div>
                <div className="settings-row">
                  <label>
                    <input type="checkbox" defaultChecked />
                    <span>Receive replacement offers via SMS</span>
                  </label>
                </div>
                <div className="settings-row">
                  <label>
                    <input type="checkbox" defaultChecked />
                    <span>Receive in-app notifications</span>
                  </label>
                </div>
              </div>

              <div className="settings-section">
                <h3>Preferences</h3>
                <div className="settings-row">
                  <label>Language:</label>
                  <select>
                    <option value="en">English</option>
                    <option value="tl">Tagalog</option>
                  </select>
                </div>
                <div className="settings-row">
                  <label>Theme:</label>
                  <select>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
              </div>

              <button className="save-btn">💾 Save Settings</button>
            </div>
          </div>
        )}

        {/* Security View */}
        {activeView === 'security' && (
          <div className="view-container">
            <div className="security-card">
              <h2>🔒 Security</h2>
              
              <div className="security-section">
                <h3>Password</h3>
                <p className="section-desc">Manage your account password</p>
                <button className="security-btn">🔐 Change Password</button>
              </div>

              <div className="security-section">
                <h3>Two-Factor Authentication</h3>
                <p className="section-desc">Add an extra layer of security to your account</p>
                <button className="security-btn">Enable 2FA</button>
              </div>

              <div className="security-section">
                <h3>Active Sessions</h3>
                <p className="section-desc">Manage your logged in devices</p>
                <div className="session-item">
                  <div className="session-info">
                    <span className="session-device">💻 Windows PC</span>
                    <span className="session-time">Current session</span>
                  </div>
                  <button className="logout-session-btn">Sign out</button>
                </div>
              </div>

              <div className="security-section">
                <h3>Login History</h3>
                <p className="section-desc">Recent login attempts</p>
                <div className="login-history">
                  <div className="history-item">
                    <span className="history-time">Today at 2:30 PM</span>
                    <span className="history-device">Windows PC - 192.168.1.100</span>
                    <span className="history-status">✓ Success</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
