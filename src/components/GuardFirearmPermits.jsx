import { useState, useEffect } from 'react'
import Logo from './Logo'
import '../styles/GuardFirearmPermits.css'

export default function GuardFirearmPermits({ user, onLogout, onViewChange }) {
  const [guards, setGuards] = useState([])
  const [guardPermits, setGuardPermits] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedGuardId, setSelectedGuardId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    permitNumber: '',
    trainingDate: '',
    expiryDate: ''
  })

  useEffect(() => {
    fetchGuardsAndPermits()
  }, [])

  const fetchGuardsAndPermits = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5000/api/users')
      if (!response.ok) throw new Error('Failed to fetch guards')
      const data = await response.json()
      const guardList = data.users.filter(u => u.role === 'guard')
      setGuards(guardList)

      // Fetch permits for each guard
      const permits = {}
      for (const guard of guardList) {
        try {
          const permitResponse = await fetch(`http://localhost:5000/api/guard-firearm-permits/${guard.id}`)
          if (permitResponse.ok) {
            const permitData = await permitResponse.json()
            permits[guard.id] = permitData
          }
        } catch (err) {
          permits[guard.id] = null
        }
      }
      setGuardPermits(permits)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEditPermit = async (e) => {
    e.preventDefault()
    try {
      if (!selectedGuardId) {
        setError('Please select a guard')
        return
      }

      const response = await fetch('http://localhost:5000/api/guard-firearm-permits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guardId: selectedGuardId,
          permitNumber: formData.permitNumber,
          trainingDate: formData.trainingDate,
          expiryDate: formData.expiryDate
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save permit')
      }

      setShowModal(false)
      setFormData({ permitNumber: '', trainingDate: '', expiryDate: '' })
      setSelectedGuardId('')
      await fetchGuardsAndPermits()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEditClick = (guardId) => {
    const permit = guardPermits[guardId]
    if (permit) {
      setFormData({
        permitNumber: permit.permitNumber,
        trainingDate: permit.trainingDate.split('T')[0],
        expiryDate: permit.expiryDate.split('T')[0]
      })
    } else {
      setFormData({ permitNumber: '', trainingDate: '', expiryDate: '' })
    }
    setSelectedGuardId(guardId)
    setShowModal(true)
  }

  const isPermitExpiring = (expiryDate) => {
    const expiry = new Date(expiryDate)
    const today = new Date()
    const daysUntilExpiry = (expiry - today) / (1000 * 60 * 60 * 24)
    return daysUntilExpiry <= 30
  }

  const isPermitExpired = (expiryDate) => {
    return new Date() > new Date(expiryDate)
  }

  const filteredGuards = guards.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="loading">Loading permits...</div>

  return (
    <div className="firearm-container">
      <div className="firearm-header">
        <div className="header-left">
          <Logo onClick={() => onViewChange('users')} />
          <div className="header-titles">
            <h1>Guard Firearm Permits</h1>
            <p className="subtitle">Manage guard authorizations and permits</p>
          </div>
        </div>
        <div className="header-info">
          <div className="nav-tabs">
            <button className="nav-tab" onClick={() => onViewChange('users')}>Users Management</button>
            <button className="nav-tab" onClick={() => onViewChange('firearms')}>Firearm Inventory</button>
            <button className="nav-tab" onClick={() => onViewChange('allocation')}>Allocations</button>
            <button className="nav-tab active" onClick={() => onViewChange('permits')}>Guard Permits</button>
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
      <div className="permits-header">
        <h2>Guard Firearm Permits</h2>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setSelectedGuardId('')
            setFormData({ permitNumber: '', trainingDate: '', expiryDate: '' })
            setShowModal(true)
          }}
        >
          + Assign Permit
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="permits-search">
        <input
          type="text"
          placeholder="Search guards by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredGuards.length === 0 ? (
        <p className="no-data">No guards found</p>
      ) : (
        <div className="permits-table">
          <table>
            <thead>
              <tr>
                <th>Guard Name</th>
                <th>Email</th>
                <th>Permit Number</th>
                <th>Training Date</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuards.map(guard => {
                const permit = guardPermits[guard.id]
                let status = 'No Permit'
                let statusClass = 'status-none'

                if (permit) {
                  if (isPermitExpired(permit.expiryDate)) {
                    status = 'Expired'
                    statusClass = 'status-expired'
                  } else if (isPermitExpiring(permit.expiryDate)) {
                    status = 'Expiring Soon'
                    statusClass = 'status-warning'
                  } else {
                    status = 'Active'
                    statusClass = 'status-active'
                  }
                }

                return (
                  <tr key={guard.id}>
                    <td>{guard.name}</td>
                    <td>{guard.email}</td>
                    <td>{permit?.permitNumber || '-'}</td>
                    <td>{permit?.trainingDate ? new Date(permit.trainingDate).toLocaleDateString() : '-'}</td>
                    <td>{permit?.expiryDate ? new Date(permit.expiryDate).toLocaleDateString() : '-'}</td>
                    <td>
                      <span className={`badge ${statusClass}`}>
                        {status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm btn-edit"
                        onClick={() => handleEditClick(guard.id)}
                      >
                        {permit ? 'Edit' : 'Assign'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>
                {guardPermits[selectedGuardId] ? 'Edit Permit' : 'Assign Firearm Permit'}
              </h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddEditPermit} className="modal-body">
              <div className="form-group">
                <label>Guard</label>
                <select
                  value={selectedGuardId}
                  onChange={(e) => setSelectedGuardId(e.target.value)}
                  required
                  disabled={guardPermits[selectedGuardId] !== undefined}
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
                <label>Permit Number</label>
                <input
                  type="text"
                  value={formData.permitNumber}
                  onChange={(e) => setFormData({ ...formData, permitNumber: e.target.value })}
                  placeholder="e.g., PERMIT-001"
                  required
                />
              </div>

              <div className="form-group">
                <label>Training Date</label>
                <input
                  type="date"
                  value={formData.trainingDate}
                  onChange={(e) => setFormData({ ...formData, trainingDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {guardPermits[selectedGuardId] ? 'Update' : 'Assign'} Permit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
