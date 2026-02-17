import { useState, useEffect } from 'react'
import Logo from './Logo'
import '../styles/FirearmInventory.css'

export default function FirearmInventory({ user, onLogout, onViewChange }) {
  const [firearms, setFirearms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const [formData, setFormData] = useState({
    serialNumber: '',
    model: '',
    condition: 'good',
    status: 'available'
  })

  useEffect(() => {
    fetchFirearms()
  }, [])

  const fetchFirearms = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5000/api/firearms')
      if (!response.ok) throw new Error('Failed to fetch firearms')
      const data = await response.json()
      setFirearms(data.firearms || [])
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddFirearm = async (e) => {
    e.preventDefault()
    try {
      const method = editingId ? 'PUT' : 'POST'
      const endpoint = editingId ? `/api/firearms/${editingId}` : '/api/firearms'

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to save firearm')

      setShowModal(false)
      setFormData({ serialNumber: '', model: '', condition: 'good', status: 'available' })
      setEditingId(null)
      fetchFirearms()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEdit = (firearm) => {
    setFormData({
      serialNumber: firearm.serialNumber,
      model: firearm.model,
      condition: firearm.condition,
      status: firearm.status
    })
    setEditingId(firearm.id)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this firearm?')) return

    try {
      const response = await fetch(`http://localhost:5000/api/firearms/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete firearm')

      fetchFirearms()
    } catch (err) {
      setError(err.message)
    }
  }

  const filteredFirearms = firearms.filter(f => {
    const matchesSearch = f.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         f.model.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || f.status === filterStatus

    return matchesSearch && matchesStatus
  })

  return (
    <div className="firearm-container">
      <div className="firearm-header">
        <div className="header-left">
          <Logo onClick={() => onViewChange('users')} />
          <div className="header-titles">
            <h1>Firearm Inventory</h1>
            <p className="subtitle">Manage firearms and track inventory</p>
          </div>
        </div>
        <div className="header-info">
          <div className="nav-tabs">
            <button className="nav-tab" onClick={() => onViewChange('users')}>Users Management</button>
            <button className="nav-tab active" onClick={() => onViewChange('firearms')}>Firearm Inventory</button>
            <button className="nav-tab" onClick={() => onViewChange('allocation')}>Allocations</button>
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
      <div className="inventory-header">
        <h2>Firearm Inventory</h2>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setEditingId(null)
            setFormData({ serialNumber: '', model: '', condition: 'good', status: 'available' })
            setShowModal(true)
          }}
        >
          + Add Firearm
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="inventory-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by serial or model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="allocated">Allocated</option>
            <option value="maintenance">Maintenance</option>
            <option value="damaged">Damaged</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="loading">Loading firearms...</p>
      ) : filteredFirearms.length === 0 ? (
        <p className="no-data">No firearms found</p>
      ) : (
        <div className="firearms-table">
          <table>
            <thead>
              <tr>
                <th>Serial Number</th>
                <th>Model</th>
                <th>Condition</th>
                <th>Status</th>
                <th>Last Maintenance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFirearms.map(firearm => (
                <tr key={firearm.id}>
                  <td>{firearm.serialNumber}</td>
                  <td>{firearm.model}</td>
                  <td>
                    <span className={`badge badge-${firearm.condition}`}>
                      {firearm.condition}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${firearm.status}`}>
                      {firearm.status}
                    </span>
                  </td>
                  <td>
                    {firearm.lastMaintenanceDate 
                      ? new Date(firearm.lastMaintenanceDate).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td className="actions">
                    <button 
                      className="btn btn-sm btn-edit"
                      onClick={() => handleEdit(firearm)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(firearm.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingId ? 'Edit Firearm' : 'Add New Firearm'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddFirearm} className="modal-body">
              <div className="form-group">
                <label>Serial Number</label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  required
                  disabled={editingId !== null}
                />
              </div>

              <div className="form-group">
                <label>Model</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  required
                  disabled={editingId !== null}
                />
              </div>

              <div className="form-group">
                <label>Condition</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="damaged">Damaged</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="available">Available</option>
                  <option value="allocated">Allocated</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="damaged">Damaged</option>
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Update' : 'Add'} Firearm
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
