import { useState, useEffect } from 'react'
import Logo from './Logo'
import './PerformanceDashboard.css'

export default function PerformanceDashboard({ user, onLogout, onViewChange }) {
  const [guards, setGuards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedGuard, setSelectedGuard] = useState(null)
  const [guardDetails, setGuardDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('merit')

  useEffect(() => {
    fetchMeritScores()
  }, [])

  const fetchMeritScores = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('http://localhost:5000/api/performance/merit-scores', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.text()
        console.error('API Error:', response.status, errorData)
        throw new Error(`API returned status ${response.status}: ${errorData}`)
      }
      
      const data = await response.json()
      setGuards(data.scores || [])
    } catch (err) {
      console.error('Fetch Error:', err)
      setError('Error loading performance data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchGuardDetails = async (guardId) => {
    try {
      setDetailsLoading(true)
      const response = await fetch(`http://localhost:5000/api/performance/guards/${guardId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.text()
        console.error('API Error:', response.status, errorData)
        throw new Error(`API returned status ${response.status}: ${errorData}`)
      }
      
      const data = await response.json()
      setGuardDetails(data)
    } catch (err) {
      console.error('Fetch Error:', err)
      setError('Error loading guard details: ' + err.message)
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleSelectGuard = (guard) => {
    setSelectedGuard(guard)
    fetchGuardDetails(guard.id)
  }

  const filteredGuards = guards.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.phone.includes(searchTerm)
  )

  const sortedGuards = [...filteredGuards].sort((a, b) => {
    switch (sortBy) {
      case 'merit':
        return b.meritScore - a.meritScore
      case 'attendance':
        return b.attendanceScore - a.attendanceScore
      case 'punctuality':
        return b.punctualityScore - a.punctualityScore
      case 'feedback':
        return b.feedbackScore - a.feedbackScore
      default:
        return 0
    }
  })

  const getMeritColor = (score) => {
    if (score >= 90) return '#2e7d32'
    if (score >= 80) return '#558b2f'
    if (score >= 70) return '#f9a825'
    if (score >= 60) return '#f57c00'
    return '#d32f2f'
  }

  const getMeritLabel = (score) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Good'
    if (score >= 70) return 'Average'
    if (score >= 60) return 'Fair'
    return 'Poor'
  }

  return (
    <div className="performance-container">
      <div className="performance-box">
        <div className="performance-header">
          <div className="header-left">
            <Logo onClick={() => onViewChange('users')} />
            <h1>Guard Performance Management</h1>
          </div>
          <div className="header-right">
            {onViewChange && (
              <div className="nav-tabs">
                <button className="nav-tab" onClick={() => onViewChange('users')}>Users Management</button>
                <button className="nav-tab active" onClick={() => onViewChange('performance')}>Performance Analytics</button>
              </div>
            )}
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="performance-content">
          {/* Merit Scores List */}
          <div className={`merit-list ${selectedGuard ? 'compact' : ''}`}>
            <div className="list-header">
              <h2>Guard Rankings</h2>
              <button onClick={fetchMeritScores} className="refresh-btn" disabled={loading}>
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            <div className="controls">
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
                <option value="merit">Sort by Merit Score</option>
                <option value="attendance">Sort by Attendance</option>
                <option value="punctuality">Sort by Punctuality</option>
                <option value="feedback">Sort by Feedback</option>
              </select>
            </div>

            {loading ? (
              <div className="loading">Loading...</div>
            ) : sortedGuards.length === 0 ? (
              <div className="empty">No guards found</div>
            ) : (
              <div className="guards-list">
                {sortedGuards.map((guard, index) => (
                  <div
                    key={guard.id}
                    className={`guard-card ${selectedGuard?.id === guard.id ? 'selected' : ''}`}
                    onClick={() => handleSelectGuard(guard)}
                  >
                    <div className="card-rank">#{index + 1}</div>
                    <div className="card-info">
                      <div className="card-name">{guard.name}</div>
                      <div className="card-email">{guard.email}</div>
                      <div className="card-phone">{guard.phone}</div>
                    </div>
                    <div
                      className="card-score"
                      style={{ backgroundColor: getMeritColor(guard.meritScore) }}
                    >
                      <div className="score-value">{guard.meritScore}</div>
                      <div className="score-label">{getMeritLabel(guard.meritScore)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Guard Details */}
          {selectedGuard && (
            <div className="guard-details">
              <button
                className="close-details"
                onClick={() => {
                  setSelectedGuard(null)
                  setGuardDetails(null)
                }}
              >
                ×
              </button>

              {detailsLoading ? (
                <div className="loading">Loading details...</div>
              ) : guardDetails ? (
                <>
                  <div className="details-header">
                    <h3>{guardDetails.guard.name}</h3>
                    <div className="details-badge" style={{ backgroundColor: getMeritColor(guardDetails.metrics.meritScore) }}>
                      {guardDetails.metrics.meritScore} - {getMeritLabel(guardDetails.metrics.meritScore)}
                    </div>
                  </div>

                  <div className="contact-info">
                    <div><strong>Email:</strong> {guardDetails.guard.email}</div>
                    <div><strong>Phone:</strong> {guardDetails.guard.phone}</div>
                    <div><strong>Status:</strong> {guardDetails.guard.verified ? '✓ Verified' : 'Not Verified'}</div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <div className="metric-title">Merit Score</div>
                      <div className="metric-value" style={{ color: getMeritColor(guardDetails.metrics.meritScore) }}>
                        {guardDetails.metrics.meritScore}%
                      </div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-title">Attendance Score</div>
                      <div className="metric-value" style={{ color: getMeritColor(guardDetails.metrics.attendanceScore) }}>
                        {guardDetails.metrics.attendanceScore}%
                      </div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-title">Punctuality Score</div>
                      <div className="metric-value" style={{ color: getMeritColor(guardDetails.metrics.punctualityScore) }}>
                        {guardDetails.metrics.punctualityScore}%
                      </div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-title">Feedback Score</div>
                      <div className="metric-value" style={{ color: getMeritColor(guardDetails.metrics.feedbackScore) }}>
                        {guardDetails.metrics.feedbackScore}%
                      </div>
                    </div>
                  </div>

                  {/* Attendance Summary */}
                  <div className="section">
                    <h4>Attendance Summary (Last 30 Days)</h4>
                    <div className="summary-grid">
                      <div className="summary-item">
                        <div className="summary-label">Days Present</div>
                        <div className="summary-value">{guardDetails.attendance.daysPresent}</div>
                      </div>
                      <div className="summary-item">
                        <div className="summary-label">Days Absent</div>
                        <div className="summary-value">{guardDetails.attendance.daysAbsent}</div>
                      </div>
                      <div className="summary-item">
                        <div className="summary-label">On Time</div>
                        <div className="summary-value">{guardDetails.attendance.onTimeCount}</div>
                      </div>
                      <div className="summary-item">
                        <div className="summary-label">Late</div>
                        <div className="summary-value">{guardDetails.attendance.lateCount}</div>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Summary */}
                  <div className="section">
                    <h4>Feedback ({guardDetails.feedback.total} feedback received)</h4>
                    <div className="feedback-summary">
                      <div className="average-rating">
                        <div className="rating-value">{guardDetails.feedback.averageRating}</div>
                        <div className="rating-label">Average Rating (out of 5)</div>
                      </div>
                    </div>

                    {guardDetails.feedback.records.length > 0 && (
                      <div className="feedback-list">
                        {guardDetails.feedback.records.map((feedback, idx) => (
                          <div key={idx} className="feedback-item">
                            <div className="feedback-header">
                              <div className="feedback-rating">★ {feedback.rating}/5</div>
                              <div className="feedback-date">{new Date(feedback.submittedAt).toLocaleDateString()}</div>
                            </div>
                            {feedback.comment && <div className="feedback-comment">{feedback.comment}</div>}
                            <div className="feedback-submitter">by {feedback.submittedBy}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="error-message">Could not load guard details</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
