import { useState, useEffect, FC } from 'react'
import Logo from './Logo'
import './AdminDashboard.css'

interface User {
  id: string
  email: string
  username: string
  role: string
  [key: string]: any
}

interface AdminDashboardProps {
  user: User
  onLogout: () => void
  onViewChange?: (view: string) => void
}

const AdminDashboard: FC<AdminDashboardProps> = ({ onLogout, onViewChange }) => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

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
      setError('Error loading users: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setLoading(false)
    }
  }

  const handleViewChange = (view: string) => {
    if (onViewChange) {
      onViewChange(view)
    }
  }

  const handleLogout = () => {
    onLogout()
  }

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <Logo />
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </header>

      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading">Loading users...</div>}

      {!loading && (
        <div className="users-list">
          <h2>Users</h2>
          {users.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: User) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.username}</td>
                    <td>{u.role}</td>
                    <td>
                      <button onClick={() => handleViewChange('edit')}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No users found</p>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
