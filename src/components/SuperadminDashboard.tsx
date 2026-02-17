import { useState, useEffect, FC } from 'react'
import Logo from './Logo'
import './SuperadminDashboard.css'

interface User {
  id: string
  email: string
  username: string
  role: string
  [key: string]: any
}

interface SuperadminDashboardProps {
  user: User
  onLogout: () => void
  onViewChange?: (view: string) => void
}

const SuperadminDashboard: FC<SuperadminDashboardProps> = ({ onLogout }) => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="superadmin-dashboard">
      <header className="dashboard-header">
        <Logo />
        <h1>Superadmin Dashboard</h1>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </header>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="content">
          <h2>System Overview</h2>
          <p>Total Users: {users.length}</p>
        </div>
      )}
    </div>
  )
}

export default SuperadminDashboard
