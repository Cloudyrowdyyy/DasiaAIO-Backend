import { useState, useEffect } from 'react'
import Logo from './Logo'
import './AdminDashboard.css'

export default function AdminDashboard({ user, onLogout }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const isAdmin = user?.role === 'admin'

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
      setUsers(data.users)
      setError('')
    } catch (err) {
      setError('Error loading users: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (u) => {
    setEditingUser(u.id)
    setEditFormData({
      fullName: u.fullName || '',
      phoneNumber: u.phoneNumber || '',
      licenseNumber: u.licenseNumber || '',
      licenseExpiryDate: u.licenseExpiryDate ? u.licenseExpiryDate.split('T')[0] : ''
    })
  }

  const handleEditSave = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${editingUser}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      })

      if (!response.ok) {
        throw new Error('Failed to update user')
      }

      setEditingUser(null)
      setError('')
      fetchUsers()
    } catch (err) {
      setError('Error updating user: ' + err.message)
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

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="header-left">
          <Logo />
          <h1>{isSuperadmin ? 'Superadmin Dashboard' : 'Admin Dashboard'}</h1>
        </div>
        <div className="header-info">
          <span>Welcome, {user.username}! {isSuperadmin && <span className="badge-super">SUPERADMIN</span>}</span>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="admin-content">
        <div className="stats-section">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p className="stat-number">{users.length}</p>
          </div>
          <div className="stat-card">
            <h3>Admins</h3>
            <p className="stat-number">{users.filter(u => u.role === 'admin').length}</p>
          </div>
          <div className="stat-card">
            <h3>Regular Users</h3>
            <p className="stat-number">{users.filter(u => u.role === 'user').length}</p>
          </div>
        </div>

        <div className="users-section">
          <div className="section-header">
            <h2>All Users</h2>
            <button onClick={fetchUsers} className="refresh-btn" disabled={loading}>
              Refresh
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="loading">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="empty">No users found</div>
          ) : (
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>License Number</th>
                    <th>License Expiry</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Created</th>
                    {isSuperadmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className={u.role === 'admin' || u.role === 'superadmin' ? 'admin-row' : ''}>
                      <td>{editingUser === u.id ? <input type="text" value={editFormData.fullName} onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})} /> : u.fullName || '-'}</td>
                      <td>{u.email}</td>
                      <td>{editingUser === u.id ? <input type="tel" value={editFormData.phoneNumber} onChange={(e) => setEditFormData({...editFormData, phoneNumber: e.target.value})} /> : u.phoneNumber || '-'}</td>
                      <td>{editingUser === u.id ? <input type="text" value={editFormData.licenseNumber} onChange={(e) => setEditFormData({...editFormData, licenseNumber: e.target.value})} /> : u.licenseNumber || '-'}</td>
                      <td>{editingUser === u.id ? <input type="date" value={editFormData.licenseExpiryDate} onChange={(e) => setEditFormData({...editFormData, licenseExpiryDate: e.target.value})} /> : u.licenseExpiryDate ? new Date(u.licenseExpiryDate).toLocaleDateString() : '-'}</td>
                      <td>{u.username}</td>
                      <td>
                        <span className={`role-badge ${u.role}`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      {isSuperadmin && (
                        <td>
                          {editingUser === u.id ? (
                            <div className="action-buttons">
                              <button className="save-btn" onClick={handleEditSave}>Save</button>
                              <button className="cancel-btn" onClick={() => setEditingUser(null)}>Cancel</button>
                            </div>
                          ) : (
                            <div className="action-buttons">
                              <button className="edit-btn" onClick={() => handleEditClick(u)}>Edit</button>
                              <button className="delete-btn" onClick={() => setShowDeleteConfirm(u.id)}>Delete</button>
                            </div>
                          )}
                        </td>
                      )}
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
              <h3>Delete User?</h3>
              <p>This action cannot be undone.</p>
              <div className="confirm-buttons">
                <button className="confirm-delete" onClick={() => handleDeleteConfirm(showDeleteConfirm)}>Delete</button>
                <button className="confirm-cancel" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
