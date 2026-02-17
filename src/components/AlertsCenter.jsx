import { useState, useEffect } from 'react'
import './AlertsCenter.css'

export default function AlertsCenter({ user, onClose }) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedAlert, setSelectedAlert] = useState(null)

  useEffect(() => {
    fetchAlerts()
  }, [filter])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const query = filter === 'unread' ? '?isRead=false' : '?limit=100'
      const response = await fetch(`http://localhost:5000/api/alerts${query}`)
      
      if (!response.ok) throw new Error('Failed to fetch alerts')
      
      const data = await response.json()
      setAlerts(data.alerts || [])
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (alertId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/alerts/${alertId}/read`, {
        method: 'PATCH'
      })
      
      if (!response.ok) throw new Error('Failed to mark alert as read')
      
      // Update local state
      setAlerts(alerts.map(a => 
        a.id === alertId ? { ...a, isRead: true } : a
      ))
    } catch (error) {
      console.error('Error marking alert as read:', error)
    }
  }

  const deleteAlert = async (alertId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/alerts/${alertId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete alert')
      
      setAlerts(alerts.filter(a => a.id !== alertId))
      setSelectedAlert(null)
    } catch (error) {
      console.error('Error deleting alert:', error)
    }
  }

  const getPriorityClass = (priority) => {
    return `priority-${priority}`
  }

  const getAlertIcon = (type) => {
    const icons = {
      'permit_expiry': '⏰',
      'maintenance_due': '🔧',
      'low_stock': '📦',
      'allocation': '🎯',
      'general': 'ℹ️'
    }
    return icons[type] || 'ℹ️'
  }

  const getAlertColor = (type) => {
    const colors = {
      'permit_expiry': '#ff6b6b',
      'maintenance_due': '#ffa500',
      'low_stock': '#ffd700',
      'allocation': '#4ecdc4',
      'general': '#95e1d3'
    }
    return colors[type] || '#95e1d3'
  }

  const unreadCount = alerts.filter(a => !a.isRead).length

  return (
    <div className="alerts-center-modal">
      <div className="alerts-center">
        <div className="alerts-header">
          <h2>🔔 Alerts & Notifications</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="alerts-stats">
          <div className="stat-box">
            <span className="stat-label">Total Alerts</span>
            <span className="stat-value">{alerts.length}</span>
          </div>
          <div className="stat-box unread">
            <span className="stat-label">Unread</span>
            <span className="stat-value">{unreadCount}</span>
          </div>
        </div>

        <div className="alerts-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Alerts
          </button>
          <button 
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread Only
          </button>
          <button 
            className="filter-btn refresh"
            onClick={fetchAlerts}
          >
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="no-alerts">
            <p>✨ No alerts at this time</p>
          </div>
        ) : (
          <div className="alerts-list">
            {alerts.map(alert => (
              <div 
                key={alert.id} 
                className={`alert-item ${!alert.isRead ? 'unread' : ''} ${getPriorityClass(alert.priority)}`}
                onClick={() => setSelectedAlert(alert.id)}
              >
                <div className="alert-icon" style={{ color: getAlertColor(alert.type) }}>
                  {getAlertIcon(alert.type)}
                </div>
                
                <div className="alert-content">
                  <div className="alert-title">
                    {alert.title}
                    {!alert.isRead && <span className="unread-badge">NEW</span>}
                  </div>
                  <div className="alert-message">{alert.message}</div>
                  <div className="alert-meta">
                    <span className="alert-type">{alert.type.replace('_', ' ')}</span>
                    <span className="alert-time">
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="alert-actions">
                  {!alert.isRead && (
                    <button 
                      className="action-btn read"
                      onClick={(e) => {
                        e.stopPropagation()
                        markAsRead(alert.id)
                      }}
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                  <button 
                    className="action-btn delete"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteAlert(alert.id)
                    }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedAlert && alerts.find(a => a.id === selectedAlert) && (
          <div className="alert-detail">
            {(() => {
              const alert = alerts.find(a => a.id === selectedAlert)
              return (
                <div>
                  <h3>{alert.title}</h3>
                  <p><strong>Type:</strong> {alert.type.replace('_', ' ')}</p>
                  <p><strong>Priority:</strong> {alert.priority}</p>
                  <p><strong>Message:</strong> {alert.message}</p>
                  <p><strong>Date:</strong> {new Date(alert.createdAt).toLocaleString()}</p>
                  <div className="detail-actions">
                    {!alert.isRead && (
                      <button onClick={() => markAsRead(alert.id)}>Mark as Read</button>
                    )}
                    <button onClick={() => deleteAlert(alert.id)} className="danger">Delete</button>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
