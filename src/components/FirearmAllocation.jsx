import { useState, useEffect } from 'react'
import Logo from './Logo'
import '../styles/FirearmAllocation.css'

export default function FirearmAllocation({ user, onLogout, onViewChange }) {
  const [firearms, setFirearms] = useState([])
  const [guards, setGuards] = useState([])
  const [activeAllocations, setActiveAllocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('issue') // 'issue' or 'return'
  const [showModal, setShowModal] = useState(false)

  const [issueForm, setIssueForm] = useState({
    firearmId: '',
    guardId: '',
    notes: ''
  })

  const [returnForm, setReturnForm] = useState({
    allocationId: '',
    condition: 'good',
    notes: ''
  })

  useEffect(() => {
    Promise.all([
      fetchFirearms(),
      fetchGuards(),
      fetchActiveAllocations()
    ]).finally(() => setLoading(false))
  }, [])

  const fetchFirearms = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/firearms')
      if (!response.ok) throw new Error('Failed to fetch firearms')
      const data = await response.json()
      setFirearms(data.firearms.filter(f => f.status === 'available'))
    } catch (err) {
      setError(err.message)
    }
  }

  const fetchGuards = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users')
      if (!response.ok) throw new Error('Failed to fetch guards')
      const data = await response.json()
      setGuards(data.users.filter(u => u.role === 'guard') || [])
    } catch (err) {
      setError(err.message)
    }
  }

  const fetchActiveAllocations = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/firearm-allocations/active')
      if (!response.ok) throw new Error('Failed to fetch allocations')
      const data = await response.json()
      setActiveAllocations(data.allocations || [])
    } catch (err) {
      setError(err.message)
    }
  }

  const handleIssueFirearm = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:5000/api/firearm-allocation/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issueForm)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to issue firearm')
      }

      setShowModal(false)
      setIssueForm({ firearmId: '', guardId: '', notes: '' })
      await Promise.all([fetchFirearms(), fetchActiveAllocations()])
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleReturnFirearm = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:5000/api/firearm-allocation/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnForm)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to return firearm')
      }

      setShowModal(false)
      setReturnForm({ allocationId: '', condition: 'good', notes: '' })
      await Promise.all([fetchFirearms(), fetchActiveAllocations()])
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  const getGuardName = (guardId) => {
    const guard = guards.find(g => g.id === guardId)
    return guard ? guard.name : 'Unknown Guard'
  }

  const getFirearmInfo = (firearmId) => {
    const firearm = firearms.find(f => f.id === firearmId) || 
                   activeAllocations.map(a => ({ id: a.firearmId, serialNumber: 'N/A' })).find(f => f.id === firearmId)
    return firearm ? firearm.serialNumber : 'Unknown'
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="firearm-container">
      <div className="firearm-header">
        <div className="header-left">
          <Logo onClick={() => onViewChange('users')} />
          <div className="header-titles">
            <h1>Firearm Allocations</h1>
            <p className="subtitle">Issue and return firearms to guards</p>
          </div>
        </div>
        <div className="header-info">
          <div className="nav-tabs">
            <button className="nav-tab" onClick={() => onViewChange('users')}>Users Management</button>
            <button className="nav-tab" onClick={() => onViewChange('firearms')}>Firearm Inventory</button>
            <button className="nav-tab active" onClick={() => onViewChange('allocation')}>Allocations</button>
            <button className="nav-tab" onClick={() => onViewChange('permits')}>Guard Permits</button>
            <button className="nav-tab" onClick={() => onViewChange('maintenance')}>Maintenance</button>
          </div>
          <div className="user-info">
            <span className="user-name">{user?.username}</span>
            <span className="user-badge">ADMIN</span>
          </div>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="firearm-content">
      <div className="allocation-header">
        <h2>Firearm Allocation Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          {tab === 'issue' ? '+ Issue Firearm' : '+ Return Firearm'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="allocation-tabs">
        <button 
          className={`tab-btn ${tab === 'issue' ? 'active' : ''}`}
          onClick={() => setTab('issue')}
        >
          Issue Firearm
        </button>
        <button 
          className={`tab-btn ${tab === 'return' ? 'active' : ''}`}
          onClick={() => setTab('return')}
        >
          Return Firearm
        </button>
      </div>

      {tab === 'issue' ? (
        <div className="allocation-section">
          <h3>Available Firearms for Issue</h3>
          {firearms.length === 0 ? (
            <p className="no-data">No available firearms</p>
          ) : (
            <div className="firearms-list">
              {firearms.map(firearm => (
                <div key={firearm.id} className="firearm-card">
                  <div className="firearm-info">
                    <h4>{firearm.serialNumber}</h4>
                    <p>{firearm.model}</p>
                    <p className="status">Condition: {firearm.condition}</p>
                  </div>
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={() => {
                      setIssueForm({ ...issueForm, firearmId: firearm.id })
                      setShowModal(true)
                    }}
                  >
                    Issue
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="allocation-section">
          <h3>Active Allocations</h3>
          {activeAllocations.length === 0 ? (
            <p className="no-data">No active allocations</p>
          ) : (
            <div className="allocations-table">
              <table>
                <thead>
                  <tr>
                    <th>Firearm Serial</th>
                    <th>Guard</th>
                    <th>Issued Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeAllocations.map(allocation => (
                    <tr key={allocation.id}>
                      <td>{getFirearmInfo(allocation.firearmId)}</td>
                      <td>{getGuardName(allocation.guardId)}</td>
                      <td>{new Date(allocation.issuedAt).toLocaleDateString()}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-warning"
                          onClick={() => {
                            setReturnForm({ ...returnForm, allocationId: allocation.id })
                            setShowModal(true)
                          }}
                        >
                          Return
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{tab === 'issue' ? 'Issue Firearm' : 'Return Firearm'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            {tab === 'issue' ? (
              <form onSubmit={handleIssueFirearm} className="modal-body">
                <div className="form-group">
                  <label>Select Firearm</label>
                  <select
                    value={issueForm.firearmId}
                    onChange={(e) => setIssueForm({ ...issueForm, firearmId: e.target.value })}
                    required
                  >
                    <option value="">-- Select Firearm --</option>
                    {firearms.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.serialNumber} - {f.model}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Select Guard</label>
                  <select
                    value={issueForm.guardId}
                    onChange={(e) => setIssueForm({ ...issueForm, guardId: e.target.value })}
                    required
                  >
                    <option value="">-- Select Guard --</option>
                    {guards.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Notes (Optional)</label>
                  <textarea
                    value={issueForm.notes}
                    onChange={(e) => setIssueForm({ ...issueForm, notes: e.target.value })}
                    placeholder="Any additional information..."
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Issue Firearm
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleReturnFirearm} className="modal-body">
                <div className="form-group">
                  <label>Select Allocation</label>
                  <select
                    value={returnForm.allocationId}
                    onChange={(e) => setReturnForm({ ...returnForm, allocationId: e.target.value })}
                    required
                  >
                    <option value="">-- Select Allocation --</option>
                    {activeAllocations.map(a => (
                      <option key={a.id} value={a.id}>
                        {getFirearmInfo(a.firearmId)} - {getGuardName(a.guardId)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Firearm Condition</label>
                  <select
                    value={returnForm.condition}
                    onChange={(e) => setReturnForm({ ...returnForm, condition: e.target.value })}
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Notes (Optional)</label>
                  <textarea
                    value={returnForm.notes}
                    onChange={(e) => setReturnForm({ ...returnForm, notes: e.target.value })}
                    placeholder="Any damage or issues to report..."
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Return Firearm
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
