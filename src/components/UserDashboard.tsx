import { useState, useEffect, FC } from 'react'
import Logo from './Logo'
import { API_BASE_URL } from '../config'
import './UserDashboard.css'

interface User {
  id: string
  email: string
  username: string
  full_name?: string
  phone_number?: string
  license_number?: string
  license_expiry_date?: string
  [key: string]: any
}

interface UserDashboardProps {
  user: User
  onLogout: () => void
}

interface AttendanceRecord {
  id: string
  date: string
  checkIn: string
  checkOut: string
  hours: number
  status: string
}

const UserDashboard: FC<UserDashboardProps> = ({ user, onLogout }) => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAttendance()
  }, [])

  const fetchAttendance = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/attendance`)
      if (response.ok) {
        const data = await response.json()
        setAttendance(data.attendance || [])
      }
    } catch (err) {
      console.error('Error fetching attendance:', err)
    } finally {
      setLoading(false)
    }
  }

  const isLicenseExpired = () => {
    if (!user?.license_expiry_date) return false
    return new Date(user.license_expiry_date) < new Date()
  }

  const daysUntilExpiry = () => {
    if (!user?.license_expiry_date) return null
    const days = Math.ceil((new Date(user.license_expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  return (
    <div className="user-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <Logo />
          <div className="header-info">
            <h1>Welcome, {user?.username}</h1>
            <p className="user-role">Guard</p>
          </div>
        </div>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </header>

      <div className="dashboard-container">
        {/* Profile Section */}
        <section className="profile-section">
          <div className="section-title">
            <h2>My Profile</h2>
          </div>
          <div className="profile-grid">
            <div className="profile-card">
              <label>Full Name</label>
              <p>{user?.full_name || 'N/A'}</p>
            </div>
            <div className="profile-card">
              <label>Email</label>
              <p>{user?.email || 'N/A'}</p>
            </div>
            <div className="profile-card">
              <label>Phone</label>
              <p>{user?.phone_number || 'N/A'}</p>
            </div>
            <div className="profile-card">
              <label>License Number</label>
              <p>{user?.license_number || 'N/A'}</p>
            </div>
          </div>
        </section>

        {/* License Status */}
        <section className="license-section">
          <div className="section-title">
            <h2>License Status</h2>
          </div>
          <div className={`license-status ${isLicenseExpired() ? 'expired' : 'active'}`}>
            <div className="license-info">
              <p className="license-label">License Expiry Date</p>
              <p className="license-date">{user?.license_expiry_date ? new Date(user.license_expiry_date).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div className={`license-badge ${isLicenseExpired() ? 'expired-badge' : 'active-badge'}`}>
              {isLicenseExpired() ? (
                <>
                  <span className="badge-icon">⚠️</span>
                  <span className="badge-text">EXPIRED</span>
                </>
              ) : (
                <>
                  <span className="badge-icon">✓</span>
                  <span className="badge-text">ACTIVE</span>
                  {daysUntilExpiry() !== null && (
                    <span className="badge-days">{daysUntilExpiry()} days left</span>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* Attendance Section */}
        <section className="attendance-section">
          <div className="section-title">
            <h2>Recent Attendance</h2>
          </div>
          {loading ? (
            <div className="loading">Loading attendance records...</div>
          ) : attendance.length > 0 ? (
            <div className="attendance-table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check-In</th>
                    <th>Check-Out</th>
                    <th>Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.slice(0, 5).map((record) => (
                    <tr key={record.id}>
                      <td>{new Date(record.date).toLocaleDateString()}</td>
                      <td>{record.checkIn}</td>
                      <td>{record.checkOut || '-'}</td>
                      <td>{record.hours.toFixed(1)} hrs</td>
                      <td>
                        <span className={`status-badge ${record.status?.toLowerCase()}`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-state">No attendance records found</p>
          )}
        </section>

        {/* Quick Actions */}
        <section className="quick-actions-section">
          <div className="section-title">
            <h2>Quick Links</h2>
          </div>
          <div className="actions-grid">
            <button className="action-card">
              <span className="action-icon">📋</span>
              <span className="action-text">Check Schedule</span>
            </button>
            <button className="action-card">
              <span className="action-icon">🔫</span>
              <span className="action-text">View Firearms</span>
            </button>
            <button className="action-card">
              <span className="action-icon">📜</span>
              <span className="action-text">My Permits</span>
            </button>
            <button className="action-card">
              <span className="action-icon">📞</span>
              <span className="action-text">Contact Support</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default UserDashboard
