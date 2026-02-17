import { useState, useEffect } from 'react'
import './ReplacementNotification.css'

export default function ReplacementNotification({ user }) {
  const [replacements, setReplacements] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReplacement, setSelectedReplacement] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // In a real app, this would fetch pending replacement requests for the guard
    // For now, showing mock data structure
    const mockReplacements = [
      {
        id: '1',
        clientSite: 'DASIA Mansion Complex',
        shiftTime: new Date('2026-02-17T16:00:00'),
        shiftDuration: 8,
        status: 'pending',
        score: 92.5,
        expiresIn: '25 minutes',
        originalGuardName: 'John Smith',
        reason: 'Guard failed to check in'
      }
    ]
    setReplacements(mockReplacements)
    setLoading(false)
  }, [user])

  const handleAccept = async (replacement) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/replacements/${replacement.id}/accept`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guardId: user.id })
        }
      )

      if (!response.ok) {
        alert('Failed to accept replacement')
        return
      }

      // Remove from list
      setReplacements(replacements.filter(r => r.id !== replacement.id))
      setSelectedReplacement(null)
      setShowDetails(false)
      alert('✅ Replacement accepted! You are now assigned to cover this shift.')
    } catch (error) {
      alert('Error accepting replacement: ' + error.message)
    }
  }

  const handleDecline = async (replacement) => {
    // TODO: Implement decline logic
    setReplacements(replacements.filter(r => r.id !== replacement.id))
    setSelectedReplacement(null)
    setShowDetails(false)
  }

  if (loading) {
    return <div className="loading">Loading replacement offers...</div>
  }

  if (replacements.length === 0) {
    return (
      <div className="replacement-notification-empty">
        <div className="empty-icon">✨</div>
        <h3>No pending replacement offers</h3>
        <p>You'll receive notifications when guard replacements are needed</p>
      </div>
    )
  }

  return (
    <div className="replacement-notification-container">
      <div className="notification-header">
        <h2>🔔 Replacement Offers ({replacements.length})</h2>
        <p className="subtitle">Urgent: Check-in required ASAP</p>
      </div>

      {replacements.length > 0 && (
        <div className="replacements-list">
          {replacements.map(replacement => (
            <div 
              key={replacement.id} 
              className={`replacement-card ${showDetails && selectedReplacement?.id === replacement.id ? 'expanded' : ''}`}
              onClick={() => {
                setSelectedReplacement(replacement)
                setShowDetails(!showDetails)
              }}
            >
              <div className="replacement-card-header">
                <div className="replacement-info">
                  <div className="client-site">
                    <h3>📍 {replacement.clientSite}</h3>
                    <span className="urgency-badge">🚨 URGENT</span>
                  </div>
                  <div className="shift-time">
                    🕐 {new Date(replacement.shiftTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    {` (${replacement.shiftDuration}h shift)`}
                  </div>
                </div>
                <div className="replacement-action">
                  <span className="expires">Expires: {replacement.expiresIn}</span>
                  <span className="score-badge">{replacement.score}% match</span>
                </div>
              </div>

              {showDetails && selectedReplacement?.id === replacement.id && (
                <div className="replacement-details">
                  <div className="detail-header">Replacement Details</div>
                  
                  <div className="detail-row">
                    <span className="label">Reason:</span>
                    <span className="value">{replacement.reason}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">Original Guard:</span>
                    <span className="value">{replacement.originalGuardName}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">Shift Duration:</span>
                    <span className="value">{replacement.shiftDuration} hours</span>
                  </div>

                  <div className="detail-row">
                    <span className="label">Match Score:</span>
                    <div className="score-bar">
                      <div 
                        className="score-fill"
                        style={{ width: `${replacement.score}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="replacement-actions">
                    <button 
                      className="btn-accept"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAccept(replacement)
                      }}
                    >
                      ✓ Accept Assignment
                    </button>
                    <button 
                      className="btn-decline"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDecline(replacement)
                      }}
                    >
                      ✕ Decline
                    </button>
                  </div>

                  <div className="replacement-note">
                    💡 By accepting, you confirm you can arrive at {replacement.clientSite} immediately.
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="notification-tips">
        <h3>📋 Tips for Replacements</h3>
        <ul>
          <li>Accept replacements quickly - they expire after 30 minutes</li>
          <li>Ensure you can reach the client site on time</li>
          <li>Check-in immediately upon arrival</li>
          <li>Report any issues to your supervisor</li>
          <li>Your reliability score affects future replacement offers</li>
        </ul>
      </div>
    </div>
  )
}
