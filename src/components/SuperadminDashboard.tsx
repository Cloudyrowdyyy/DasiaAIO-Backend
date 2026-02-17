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

const SuperadminDashboard: FC<SuperadminDashboardProps> = ({ onLogout, onViewChange }) => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [stats, setStats] = useState<any>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5000/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        
        // Calculate stats
        const adminCount = data.users.filter((u: User) => u.role === 'admin').length
        const guardCount = data.users.filter((u: User) => u.role === 'guard').length
        const userCount = data.users.filter((u: User) => u.role === 'user').length
        
        setStats({
          totalUsers: data.users.length,
          admins: adminCount,
          guards: guardCount,
          regularUsers: userCount
        })
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNavigate = (view: string) => {
    if (onViewChange) {
      onViewChange(view)
    }
  }

  return (
    <div className="superadmin-dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Logo />
        </div>
        <nav className="sidebar-menu">
          <button 
            className="nav-btn active" 
            onClick={() => handleNavigate('users')}
          >
            Dashboard
          </button>
          <button 
            className="nav-btn" 
            onClick={() => handleNavigate('performance')}
          >
            Performance
          </button>
          <button 
            className="nav-btn" 
            onClick={() => handleNavigate('firearms')}
          >
            Firearms
          </button>
          <button 
            className="nav-btn" 
            onClick={() => handleNavigate('allocation')}
          >
            Allocation
          </button>
          <button 
            className="nav-btn" 
            onClick={() => handleNavigate('permits')}
          >
            Permits
          </button>
          <button 
            className="nav-btn" 
            onClick={() => handleNavigate('maintenance')}
          >
            Maintenance
          </button>
        </nav>
        <button onClick={onLogout} className="logout-btn-sidebar">Logout</button>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <h1>System Dashboard</h1>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </header>

        {loading ? (
          <div className="loading">Loading system data...</div>
        ) : (
          <div className="dashboard-content">
            <section className="stats-grid">
              <div className="stat-card">
                <h3>Total Users</h3>
                <p className="stat-value">{stats.totalUsers}</p>
              </div>
              <div className="stat-card">
                <h3>Administrators</h3>
                <p className="stat-value">{stats.admins}</p>
              </div>
              <div className="stat-card">
                <h3>Guards</h3>
                <p className="stat-value">{stats.guards}</p>
              </div>
              <div className="stat-card">
                <h3>Regular Users</h3>
                <p className="stat-value">{stats.regularUsers}</p>
              </div>
            </section>

            <section className="users-section">
              <h2>All Users</h2>
              {users.length > 0 ? (
                <div className="users-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Username</th>
                        <th>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u: User) => (
                        <tr key={u.id}>
                          <td>{u.email}</td>
                          <td>{u.username}</td>
                          <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">No users found</p>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

export default SuperadminDashboard
