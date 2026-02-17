import { useState, useEffect } from 'react'
import './GuardSchedule.css'

export default function GuardSchedule({ user }) {
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedShift, setSelectedShift] = useState(null)
  const [checkedInShiftId, setCheckedInShiftId] = useState(null)

  useEffect(() => {
    if (user?.id) {
      fetchGuardShifts()
    }
  }, [user])

  const fetchGuardShifts = async () => {
    try {
      setLoading(true)
      // TODO: Create endpoint to fetch shifts for specific guard
      // For now, show mock data structure
      const mockShifts = [
        {
          id: '1',
          clientSite: 'DASIA Tagum Head Office',
          startTime: new Date('2026-02-17T08:00:00'),
          endTime: new Date('2026-02-17T16:00:00'),
          status: 'scheduled',
          checked_in: false
        },
        {
          id: '2',
          clientSite: 'DASIA Davao Branch',
          startTime: new Date('2026-02-18T16:00:00'),
          endTime: new Date('2026-02-19T00:00:00'),
          status: 'scheduled',
          checked_in: false
        }
      ]
      setShifts(mockShifts)
      setError('')
    } catch (err) {
      setError('Error loading schedule: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async (shiftId) => {
    try {
      const response = await fetch('http://localhost:5000/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guardId: user.id,
          shiftId: shiftId
        })
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Check-in failed')
        return
      }

      setCheckedInShiftId(shiftId)
      setShifts(shifts.map(s => 
        s.id === shiftId ? { ...s, status: 'in-progress', checked_in: true } : s
      ))
      setError('')
    } catch (err) {
      setError('Error checking in: ' + err.message)
    }
  }

  const handleCheckOut = async (shiftId) => {
    try {
      const response = await fetch('http://localhost:5000/api/attendance/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guardId: user.id,
          shiftId: shiftId
        })
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Check-out failed')
        return
      }

      setCheckedInShiftId(null)
      setShifts(shifts.map(s => 
        s.id === shiftId ? { ...s, status: 'completed' } : s
      ))
      setError('')
    } catch (err) {
      setError('Error checking out: ' + err.message)
    }
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    })
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getShiftStatus = (status) => {
    switch(status) {
      case 'scheduled': return '📅 Scheduled'
      case 'in-progress': return '🟢 On Duty'
      case 'completed': return '✅ Completed'
      case 'no-show': return '❌ No-Show'
      default: return status
    }
  }

  return (
    <div className="guard-schedule-container">
      <div className="schedule-header">
        <h2>My Schedule</h2>
        <button className="refresh-btn" onClick={fetchGuardShifts}>
          🔄 Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading your schedule...</div>
      ) : shifts.length === 0 ? (
        <div className="empty">No shifts scheduled</div>
      ) : (
        <div className="shifts-list">
          {shifts.map(shift => (
            <div key={shift.id} className={`shift-card shift-${shift.status}`}>
              <div className="shift-header">
                <div className="shift-site">
                  <h3>{shift.clientSite}</h3>
                  <span className="shift-status">{getShiftStatus(shift.status)}</span>
                </div>
                <div className="shift-time">
                  <div>{formatDate(shift.startTime)}</div>
                  <div className="time-range">
                    {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                  </div>
                </div>
              </div>

              <div className="shift-details">
                <div className="duration">
                  ⏱️ Duration: {Math.round((new Date(shift.endTime) - new Date(shift.startTime)) / 3600000)} hours
                </div>
              </div>

              <div className="shift-actions">
                {shift.status === 'scheduled' && !shift.checked_in && (
                  <button 
                    className="btn-check-in"
                    onClick={() => handleCheckIn(shift.id)}
                  >
                    ✓ Check In
                  </button>
                )}
                
                {shift.status === 'in-progress' && (
                  <button 
                    className="btn-check-out"
                    onClick={() => handleCheckOut(shift.id)}
                  >
                    ✓ Check Out
                  </button>
                )}

                {(shift.status === 'completed' && shift.checked_in) && (
                  <span className="badge-completed">Shift completed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="schedule-stats">
        <div className="stat">
          <div className="stat-value">{shifts.filter(s => s.status === 'scheduled').length}</div>
          <div className="stat-label">Upcoming</div>
        </div>
        <div className="stat">
          <div className="stat-value">{shifts.filter(s => s.status === 'in-progress').length}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat">
          <div className="stat-value">{shifts.filter(s => s.status === 'completed').length}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>
    </div>
  )
}
