import { useState, useEffect } from 'react'
import Logo from './Logo'
import '../styles/FirearmMaintenance.css'

export default function FirearmMaintenance({ user, onLogout, onViewChange }) {
  const [firearms, setFirearms] = useState([])
  const [maintenanceRecords, setMaintenanceRecords] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedFirearmId, setSelectedFirearmId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedFirearmId, setExpandedFirearmId] = useState(null)

  const [formData, setFormData] = useState({
    maintenanceType: 'inspection',
    notes: ''
  })

  useEffect(() => {
    fetchFirearmsAndMaintenance()
  }, [])

  const fetchFirearmsAndMaintenance = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5000/api/firearms')
      if (!response.ok) throw new Error('Failed to fetch firearms')
      const data = await response.json()
      const firearmList = data.firearms || []
      setFirearms(firearmList)

      // Fetch maintenance records for each firearm
      const records = {}
      for (const firearm of firearmList) {
        try {
          const mainResponse = await fetch(`http://localhost:5000/api/firearm-maintenance/${firearm.id}`)
          if (mainResponse.ok) {
            const mainData = await mainResponse.json()
            records[firearm.id] = mainData.records || []
          }
        } catch (err) {
          records[firearm.id] = []
        }
      }
      setMaintenanceRecords(records)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMaintenance = async (e) => {
    e.preventDefault()
    try {
      if (!selectedFirearmId) {
        setError('Please select a firearm')
        return
      }

      const response = await fetch('http://localhost:5000/api/firearm-maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firearmId: selectedFirearmId,
          maintenanceType: formData.maintenanceType,
          notes: formData.notes
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to record maintenance')
      }

      setShowModal(false)
      setFormData({ maintenanceType: 'inspection', notes: '' })
      setSelectedFirearmId('')
      await fetchFirearmsAndMaintenance()
    } catch (err) {
      setError(err.message)
    }
  }

  const getLastMaintenanceAge = (firearmId) => {
    const records = maintenanceRecords[firearmId]
    if (!records || records.length === 0) return 'Never'

    const lastMaintenance = new Date(records[0].maintenanceDate)
    const today = new Date()
    const daysOld = Math.floor((today - lastMaintenance) / (1000 * 60 * 60 * 24))

    if (daysOld === 0) return 'Today'
    if (daysOld === 1) return '1 day ago'
    if (daysOld < 30) return `${daysOld} days ago`
    if (daysOld < 365) return `${Math.floor(daysOld / 30)} months ago`
    return `${Math.floor(daysOld / 365)} years ago`
  }

  const shouldWarnMaintenance = (firearmId) => {
    const records = maintenanceRecords[firearmId]
    if (!records || records.length === 0) return true

    const lastMaintenance = new Date(records[0].maintenanceDate)
    const today = new Date()
    const daysOld = (today - lastMaintenance) / (1000 * 60 * 60 * 24)

    return daysOld > 180 // Warn if maintenance is older than 6 months
  }

  const filteredFirearms = firearms.filter(f =>
    f.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.model.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="loading">Loading maintenance records...</div>

  return (
    <div className="firearm-container">
      <div className="firearm-header">
        <div className="header-left">
          <Logo onClick={() => onViewChange('users')} />
          <div className="header-titles">
            <h1>Firearm Maintenance</h1>
            <p className="subtitle">Track firearm maintenance and repairs</p>
          </div>
        </div>
        <div className="header-info">
          <div className="nav-tabs">
            <button className="nav-tab" onClick={() => onViewChange('users')}>Users Management</button>
            <button className="nav-tab" onClick={() => onViewChange('firearms')}>Firearm Inventory</button>
            <button className="nav-tab" onClick={() => onViewChange('allocation')}>Allocations</button>
            <button className="nav-tab" onClick={() => onViewChange('permits')}>Guard Permits</button>
            <button className="nav-tab active" onClick={() => onViewChange('maintenance')}>Maintenance</button>
          </div>
          <div className="user-info">
            <span className="user-name">{user?.username}</span>
            <span className="user-badge">ADMIN</span>
          </div>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="firearm-content">
      <div className="maintenance-header">
        <h2>Firearm Maintenance Tracking</h2>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setSelectedFirearmId('')
            setFormData({ maintenanceType: 'inspection', notes: '' })
            setShowModal(true)
          }}
        >
          + Record Maintenance
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="maintenance-search">
        <input
          type="text"
          placeholder="Search by firearm serial or model..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredFirearms.length === 0 ? (
        <p className="no-data">No firearms found</p>
      ) : (
        <div className="maintenance-list">
          {filteredFirearms.map(firearm => (
            <div key={firearm.id} className="firearm-card">
              <div 
                className="card-header"
                onClick={() => setExpandedFirearmId(expandedFirearmId === firearm.id ? null : firearm.id)}
              >
                <div className="firearm-summary">
                  <h4>{firearm.serialNumber}</h4>
                  <p>{firearm.model}</p>
                  <div className="maintenance-info">
                    <span className="info-item">
                      Status: <strong>{firearm.status}</strong>
                    </span>
                    <span className="info-item">
                      Last Maintenance: <strong>{getLastMaintenanceAge(firearm.id)}</strong>
                    </span>
                    {shouldWarnMaintenance(firearm.id) && (
                      <span className="info-item warning">
                        ⚠️ Maintenance overdue
                      </span>
                    )}
                  </div>
                </div>
                <div className="card-actions">
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFirearmId(firearm.id)
                      setShowModal(true)
                    }}
                  >
                    Record
                  </button>
                  <span className="expand-icon">
                    {expandedFirearmId === firearm.id ? '▼' : '▶'}
                  </span>
                </div>
              </div>

              {expandedFirearmId === firearm.id && (
                <div className="card-body">
                  <h5>Maintenance History</h5>
                  {maintenanceRecords[firearm.id]?.length === 0 ? (
                    <p className="no-records">No maintenance records yet</p>
                  ) : (
                    <div className="records-list">
                      {maintenanceRecords[firearm.id]?.map((record, idx) => (
                        <div key={idx} className="record-item">
                          <div className="record-date">
                            {new Date(record.maintenanceDate).toLocaleDateString()}
                          </div>
                          <div className="record-content">
                            <strong className={`type type-${record.maintenanceType}`}>
                              {record.maintenanceType.toUpperCase()}
                            </strong>
                            {record.notes && <p>{record.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Record Firearm Maintenance</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddMaintenance} className="modal-body">
              <div className="form-group">
                <label>Firearm</label>
                <select
                  value={selectedFirearmId}
                  onChange={(e) => setSelectedFirearmId(e.target.value)}
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
                <label>Maintenance Type</label>
                <select
                  value={formData.maintenanceType}
                  onChange={(e) => setFormData({ ...formData, maintenanceType: e.target.value })}
                >
                  <option value="inspection">Inspection</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="service">Service</option>
                  <option value="repair">Repair</option>
                  <option value="parts_replacement">Parts Replacement</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Describe the maintenance work performed..."
                  rows="4"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Record Maintenance
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
