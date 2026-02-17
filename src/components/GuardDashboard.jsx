import { useState, useEffect } from 'react'
import './GuardDashboard.css'

export default function GuardDashboard({ user, onClose }) {
  const [allocations, setAllocations] = useState([])
  const [permits, setPermits] = useState([])
  const [loading, setLoading] = useState(true)
  const [renewalRequests, setRenewalRequests] = useState({})
  const [renewalLoading, setRenewalLoading] = useState(false)

  useEffect(() => {
    if (user) {
      fetchGuardData()
    }
  }, [user])

  const fetchGuardData = async () => {
    setLoading(true)
    try {
      // Fetch allocations for this guard
      const allocResponse = await fetch(`http://localhost:5000/api/firearm-allocations?guardId=${user._id}`)
      if (allocResponse.ok) {
        const data = await allocResponse.json()
        setAllocations(data)
      }

      // Fetch permits for this guard
      const permResponse = await fetch(`http://localhost:5000/api/guard-firearm-permits?guardId=${user._id}`)
      if (permResponse.ok) {
        const data = await permResponse.json()
        setPermits(data)
      }
    } catch (error) {
      console.error('Error fetching guard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPermitStatus = (expiryDate) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) {
      return { status: 'EXPIRED', color: '#d32f2f', daysLeft: 0 }
    } else if (daysUntilExpiry <= 30) {
      return { status: 'EXPIRING SOON', color: '#f57c00', daysLeft: daysUntilExpiry }
    } else if (daysUntilExpiry <= 90) {
      return { status: 'CAUTION', color: '#fbc02d', daysLeft: daysUntilExpiry }
    } else {
      return { status: 'ACTIVE', color: '#388e3c', daysLeft: daysUntilExpiry }
    }
  }

  const requestPermitRenewal = async (permitId) => {
    setRenewalLoading(true)
    try {
      const response = await fetch(`http://localhost:5000/api/guard-firearm-permits/${permitId}/renew-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedBy: user._id,
          requestDate: new Date()
        })
      })

      if (response.ok) {
        setRenewalRequests(prev => ({
          ...prev,
          [permitId]: true
        }))
        alert('Renewal request submitted successfully!')
      } else {
        alert('Failed to submit renewal request')
      }
    } catch (error) {
      console.error('Error requesting renewal:', error)
      alert('Failed to submit renewal request')
    } finally {
      setRenewalLoading(false)
    }
  }

  const getActiveAllocations = () => {
    return allocations.filter(a => !a.returnDate || new Date(a.returnDate) > new Date())
  }

  const getReturnedAllocations = () => {
    return allocations.filter(a => a.returnDate && new Date(a.returnDate) <= new Date())
  }

  const activeCount = getActiveAllocations().length
  const expiredPermitCount = permits.filter(p => getPermitStatus(p.expiryDate).status === 'EXPIRED').length
  const expiringPermitCount = permits.filter(p => getPermitStatus(p.expiryDate).status === 'EXPIRING SOON').length

  if (loading) {
    return (
      <div className="guard-dashboard-overlay">
        <div className="guard-dashboard-modal">
          <div className="guard-dashboard-header">
            <h2>👮 Guard Dashboard</h2>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="loading-state">
            <p>⏳ Loading your data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="guard-dashboard-overlay">
      <div className="guard-dashboard-modal">
        <div className="guard-dashboard-header">
          <h2>👮 Guard Dashboard - {user.name}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="guard-dashboard-container">
          {/* Stats Section */}
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon">🔫</span>
              <span className="stat-label">Active Allocations</span>
              <span className="stat-value">{activeCount}</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">📋</span>
              <span className="stat-label">Total Permits</span>
              <span className="stat-value">{permits.length}</span>
            </div>
            <div className="stat-card warning">
              <span className="stat-icon">⚠️</span>
              <span className="stat-label">Expiring Soon</span>
              <span className="stat-value">{expiringPermitCount}</span>
            </div>
            <div className="stat-card danger">
              <span className="stat-icon">❌</span>
              <span className="stat-label">Expired Permits</span>
              <span className="stat-value">{expiredPermitCount}</span>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="tabs-container">
            <div className="tabs">
              <button className="tab-btn active" data-tab="allocations">
                🔫 Current Firearms ({activeCount})
              </button>
              <button className="tab-btn" data-tab="permits">
                📋 My Permits ({permits.length})
              </button>
              <button className="tab-btn" data-tab="history">
                📚 Return History ({getReturnedAllocations().length})
              </button>
            </div>

            {/* Current Firearms Tab */}
            <div className="tab-content active" id="allocations">
              {activeCount === 0 ? (
                <div className="empty-message">
                  <p>📭 No firearms currently allocated to you</p>
                </div>
              ) : (
                <div className="allocations-list">
                  {getActiveAllocations().map(allocation => (
                    <div key={allocation._id} className="allocation-card">
                      <div className="alloc-header">
                        <h3>{allocation.firearmModel || allocation.firearmSerialNumber}</h3>
                        <span className={`alloc-status ${allocation.status.toLowerCase()}`}>
                          {allocation.status}
                        </span>
                      </div>
                      <div className="alloc-details">
                        <div className="detail-item">
                          <span className="label">Serial Number:</span>
                          <span className="value">{allocation.firearmSerialNumber}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Caliber:</span>
                          <span className="value">{allocation.firearmCaliber || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Allocation Date:</span>
                          <span className="value">
                            {new Date(allocation.allocationDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Purpose:</span>
                          <span className="value">{allocation.purpose}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Condition:</span>
                          <span className="value">{allocation.condition || 'Good'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Permits Tab */}
            <div className="tab-content" id="permits">
              {permits.length === 0 ? (
                <div className="empty-message">
                  <p>📭 No permits issued</p>
                </div>
              ) : (
                <div className="permits-list">
                  {permits.map(permit => {
                    const status = getPermitStatus(permit.expiryDate)
                    const isExpired = status.status === 'EXPIRED'
                    const isRenewalRequested = renewalRequests[permit._id]

                    return (
                      <div key={permit._id} className={`permit-card ${status.status.toLowerCase().replace(' ', '-')}`}>
                        <div className="permit-header">
                          <h3>{permit.firearmSerialNumber}</h3>
                          <span className="permit-status" style={{ backgroundColor: status.color }}>
                            {status.status}
                          </span>
                        </div>
                        <div className="permit-details">
                          <div className="detail-item">
                            <span className="label">Authority:</span>
                            <span className="value">{permit.authority}</span>
                          </div>
                          <div className="detail-item">
                            <span className="label">Issue Date:</span>
                            <span className="value">
                              {new Date(permit.issueDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="label">Expiry Date:</span>
                            <span className="value">
                              {new Date(permit.expiryDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="label">Days Until Expiry:</span>
                            <span className={`value ${isExpired ? 'expired' : ''}`}>
                              {isExpired ? 'EXPIRED' : `${status.daysLeft} days`}
                            </span>
                          </div>
                        </div>
                        {!isRenewalRequested && (isExpired || status.status === 'EXPIRING SOON') && (
                          <button
                            className="renew-btn"
                            onClick={() => requestPermitRenewal(permit._id)}
                            disabled={renewalLoading}
                          >
                            {renewalLoading ? '⏳ Requesting...' : '🔄 Request Renewal'}
                          </button>
                        )}
                        {isRenewalRequested && (
                          <div className="renewal-requested">
                            ✅ Renewal requested - Awaiting admin approval
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* History Tab */}
            <div className="tab-content" id="history">
              {getReturnedAllocations().length === 0 ? (
                <div className="empty-message">
                  <p>📭 No return history</p>
                </div>
              ) : (
                <div className="history-list">
                  {getReturnedAllocations().map(allocation => (
                    <div key={allocation._id} className="history-card">
                      <div className="history-header">
                        <h3>{allocation.firearmSerialNumber}</h3>
                        <span className="return-badge">✓ Returned</span>
                      </div>
                      <div className="history-details">
                        <div className="detail-item">
                          <span className="label">Allocation Date:</span>
                          <span className="value">
                            {new Date(allocation.allocationDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Return Date:</span>
                          <span className="value">
                            {new Date(allocation.returnDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Duration:</span>
                          <span className="value">
                            {Math.floor((new Date(allocation.returnDate) - new Date(allocation.allocationDate)) / (1000 * 60 * 60 * 24))} days
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Condition on Return:</span>
                          <span className="value">{allocation.conditionOnReturn || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Notes:</span>
                          <span className="value">{allocation.notes || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
