import { useState, useEffect } from 'react'
import Logo from './Logo'
import './SuperadminDashboard.css'

// Format phone number to +63-###-###-####
function formatPhoneNumber(value) {
  // Remove all non-digits
  let cleaned = value.replace(/\D/g, '')
  
  // If it starts with 0, replace with 63
  if (cleaned.startsWith('0')) {
    cleaned = '63' + cleaned.slice(1)
  }
  
  // Ensure it starts with 63
  if (!cleaned.startsWith('63')) {
    cleaned = '63' + cleaned
  }
  
  // Limit to 12 digits (63 + 10 digits)
  cleaned = cleaned.slice(0, 12)
  
  // Format as +63-###-###-####
  if (cleaned.length <= 2) {
    return '+' + cleaned
  } else if (cleaned.length <= 5) {
    return '+' + cleaned.slice(0, 2) + '-' + cleaned.slice(2)
  } else if (cleaned.length <= 8) {
    return '+' + cleaned.slice(0, 2) + '-' + cleaned.slice(2, 5) + '-' + cleaned.slice(5)
  } else {
    return '+' + cleaned.slice(0, 2) + '-' + cleaned.slice(2, 5) + '-' + cleaned.slice(5, 8) + '-' + cleaned.slice(8)
  }
}

export default function SuperadminDashboard({ user, onLogout }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hoveredRow, setHoveredRow] = useState(null)
  const [editingCell, setEditingCell] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5000/api/users')
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      // Ensure all required fields are present for each user
      const safeUsers = data.users.map(u => ({
        ...u,
        fullName: u.fullName || '',
        phoneNumber: u.phoneNumber || '',
        licenseNumber: u.licenseNumber || '',
        licenseExpiryDate: u.licenseExpiryDate || ''
      }))
      setUsers(safeUsers)
      setError('')
    } catch (err) {
      setError('Error loading users: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.phoneNumber?.includes(searchTerm)
    const matchesRole = filterRole === 'all' || u.role === filterRole
    return matchesSearch && matchesRole
  })

  const handleEditClick = (u) => {
    setEditingCell({
      userId: u.id,
      field: 'fullName',
      value: u.fullName || ''
    })
  }

  const handleCellSave = async (userId, field, newValue, currentUser) => {
    try {
      // Only send the field being edited
      const updateData = { [field]: newValue }

      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        let msg = 'Failed to update user'
        try {
          const errJson = await response.json()
          if (errJson && errJson.error) msg = errJson.error
        } catch {}
        // Only show error if not the old 'All fields are required' message
        if (msg !== 'All fields are required') {
          setError('Error updating user: ' + msg)
        } else {
          setError('')
        }
        setEditingCell(null)
        return
      }

      setEditingCell(null)
      setError('')
      fetchUsers()
    } catch (err) {
      setError('Error updating user: ' + err.message)
      setEditingCell(null)
    }
  }

  const handleEditSave = async () => {
    if (editingCell) {
      const currentUser = users.find(u => u.id === editingCell.userId)
      await handleCellSave(editingCell.userId, editingCell.field, editingCell.value, currentUser)
    }
  }

  const handleDeleteConfirm = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      setShowDeleteConfirm(null)
      setError('')
      fetchUsers()
    } catch (err) {
      setError('Error deleting user: ' + err.message)
    }
  }

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    users: users.filter(u => u.role === 'user').length,
    verified: users.filter(u => u.verified).length,
    unverified: users.filter(u => !u.verified).length
  }

  return (
    <div className="superadmin-container">
      <div className="superadmin-header">
        <div className="header-left">
          <Logo />
          <div className="header-titles">
            <h1>Superadmin Dashboard</h1>
            <p className="subtitle">Full System Management</p>
          </div>
        </div>
        <div className="header-info">
          <div className="user-info">
            <span className="user-name">{user.username}</span>
            <span className="superadmin-badge">SUPERADMIN</span>
          </div>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="superadmin-content">
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>Total Users</h3>
              <p className="stat-number">{stats.total}</p>
            </div>
          </div>
          <div className="stat-card admins">
            <div className="stat-icon">👨‍💼</div>
            <div className="stat-info">
              <h3>Admins</h3>
              <p className="stat-number">{stats.admins}</p>
            </div>
          </div>
          <div className="stat-card guards">
            <div className="stat-icon">👮</div>
            <div className="stat-info">
              <h3>Guards</h3>
              <p className="stat-number">{stats.users}</p>
            </div>
          </div>
          <div className="stat-card verified">
            <div className="stat-icon">✓</div>
            <div className="stat-info">
              <h3>Verified</h3>
              <p className="stat-number">{stats.verified}</p>
            </div>
          </div>
          <div className="stat-card unverified">
            <div className="stat-icon">⚠</div>
            <div className="stat-info">
              <h3>Unverified</h3>
              <p className="stat-number">{stats.unverified}</p>
            </div>
          </div>
        </div>

        <div className="users-management">
          <div className="management-header">
            <div className="header-title">
              <h2>User Management</h2>
              <span className="user-count">({filteredUsers.length} results)</span>
            </div>
            <button onClick={fetchUsers} className="refresh-btn" disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          <div className="controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-box">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Roles</option>
                <option value="superadmin">Superadmin</option>
                <option value="admin">Admin</option>
                <option value="user">Security Guard</option>
              </select>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="loading">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty">No users found</div>
          ) : (
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>License</th>
                    <th>Expiry</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr 
                      key={u.id} 
                      className={`user-row role-${u.role}`}
                      onMouseEnter={() => setHoveredRow(u.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      <td className="editable-cell">
                        {editingCell?.userId === u.id && editingCell?.field === 'fullName' ? (
                          <input 
                            type="text" 
                            value={editingCell.value}
                            autoFocus
                            onChange={(e) => setEditingCell({...editingCell, value: e.target.value})}
                          />
                        ) : (
                          <span 
                            className={hoveredRow === u.id ? 'hover-text' : ''}
                            onClick={() => {
                              if (!editingCell) setEditingCell({userId: u.id, field: 'fullName', value: u.fullName || ''})
                            }}
                          >
                            {u.fullName || '-'}
                          </span>
                        )}
                      </td>
                      <td className="editable-cell">
                        <span className={hoveredRow === u.id ? 'hover-text' : ''}>
                          {u.email}
                        </span>
                      </td>
                      <td className="editable-cell">
                        {editingCell?.userId === u.id && editingCell?.field === 'phoneNumber' ? (
                          <input 
                            type="text" 
                            value={editingCell.value}
                            autoFocus
                            onChange={(e) => setEditingCell({...editingCell, value: formatPhoneNumber(e.target.value)})}
                            placeholder="+63-###-###-####"
                          />
                        ) : (
                          <span 
                            className={hoveredRow === u.id ? 'hover-text' : ''}
                            onClick={() => {
                              if (!editingCell) setEditingCell({userId: u.id, field: 'phoneNumber', value: u.phoneNumber || ''})
                            }}
                          >
                            {u.phoneNumber || '-'}
                          </span>
                        )}
                      </td>
                      <td className="editable-cell">
                        {editingCell?.userId === u.id && editingCell?.field === 'licenseNumber' ? (
                          <input 
                            type="text" 
                            value={editingCell.value}
                            autoFocus
                            onChange={(e) => setEditingCell({...editingCell, value: e.target.value})}
                          />
                        ) : (
                          <span 
                            className={hoveredRow === u.id ? 'hover-text' : ''}
                            onClick={() => {
                              if (!editingCell) setEditingCell({userId: u.id, field: 'licenseNumber', value: u.licenseNumber || ''})
                            }}
                          >
                            {u.licenseNumber || '-'}
                          </span>
                        )}
                      </td>
                      <td className="editable-cell">
                        {editingCell?.userId === u.id && editingCell?.field === 'licenseExpiryDate' ? (
                          <input 
                            type="date" 
                            value={editingCell.value}
                            autoFocus
                            onChange={(e) => setEditingCell({...editingCell, value: e.target.value})}
                          />
                        ) : (
                          <span 
                            className={hoveredRow === u.id ? 'hover-text' : ''}
                            onClick={() => {
                              if (!editingCell) setEditingCell({userId: u.id, field: 'licenseExpiryDate', value: u.licenseExpiryDate ? u.licenseExpiryDate.split('T')[0] : ''})
                            }}
                          >
                            {u.licenseExpiryDate ? new Date(u.licenseExpiryDate).toLocaleDateString() : '-'}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`role-badge ${u.role}`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${u.verified ? 'verified' : 'unverified'}`}>
                          {u.verified ? '✓ Verified' : '⚠ Unverified'}
                        </span>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          {editingCell?.userId === u.id ? (
                            <>
                              <button className="save-btn" onClick={() => handleCellSave(u.id, editingCell.field, editingCell.value, u)}>Save</button>
                              <button className="cancel-btn" onClick={() => setEditingCell(null)}>Cancel</button>
                            </>
                          ) : (
                            <button className="btn-delete" onClick={() => setShowDeleteConfirm(u.id)}>Delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showDeleteConfirm && (
          <div className="delete-confirm-modal">
            <div className="delete-confirm-box">
              <div className="confirm-icon">⚠️</div>
              <h3>Delete User?</h3>
              <p>This action cannot be undone. All user data will be permanently deleted.</p>
              <div className="confirm-buttons">
                <button className="btn-confirm-delete" onClick={() => handleDeleteConfirm(showDeleteConfirm)}>Delete User</button>
                <button className="btn-confirm-cancel" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
