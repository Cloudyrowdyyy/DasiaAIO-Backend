import { useState, useEffect, FC } from 'react'
import Logo from './Logo'
import { API_BASE_URL } from '../config'
import './PerformanceDashboard.css'

interface User {
  [key: string]: any
}

interface Props {
  user: User
  onLogout: () => void
  onViewChange?: (view: string) => void
}

interface Performance {
  guardId: string
  guardName: string
  attendanceRate: number
  allocationsCompleted: number
  maintenanceCompleted: number
  [key: string]: any
}

const PerformanceDashboard: FC<Props> = ({ user, onLogout, onViewChange }) => {
  const [performance, setPerformance] = useState<Performance[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    fetchPerformance()
  }, [])

  const fetchPerformance = async () => {
    try {
      setLoading(true)
      // Simulated performance data from attendance and allocations
      const response = await fetch(`${API_BASE_URL}/api/users`)
      if (response.ok) {
        const data = await response.json()
        // Create mock performance data
        const perf = data.users.map((u: any) => ({
          guardId: u.id,
          guardName: u.email.split('@')[0],
          attendanceRate: Math.floor(Math.random() * 40 + 60),
          allocationsCompleted: Math.floor(Math.random() * 50 + 10),
          maintenanceCompleted: Math.floor(Math.random() * 20 + 5)
        }))
        setPerformance(perf)
      }
    } catch (err) {
      console.error('Error fetching performance:', err)
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
    <div className="performance-dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Logo />
        </div>
        <nav className="sidebar-menu">
          <button className="nav-btn" onClick={() => handleNavigate('users')}>
            Dashboard
          </button>
          <button className="nav-btn active" onClick={() => handleNavigate('performance')}>
            Performance
          </button>
          <button className="nav-btn" onClick={() => handleNavigate('firearms')}>
            Firearms
          </button>
          <button className="nav-btn" onClick={() => handleNavigate('allocation')}>
            Allocation
          </button>
          <button className="nav-btn" onClick={() => handleNavigate('permits')}>
            Permits
          </button>
          <button className="nav-btn" onClick={() => handleNavigate('maintenance')}>
            Maintenance
          </button>
        </nav>
        <button onClick={onLogout} className="logout-btn-sidebar">Logout</button>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <h1>Performance Dashboard</h1>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </header>

        {loading ? (
          <div className="loading">Loading performance data...</div>
        ) : (
          <div className="dashboard-content">
            <section className="performance-table-section">
              <h2>Guard Performance</h2>
              {performance.length > 0 ? (
                <table className="performance-table">
                  <thead>
                    <tr>
                      <th>Guard Name</th>
                      <th>Attendance Rate</th>
                      <th>Allocations</th>
                      <th>Maintenance Tasks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performance.map((p) => (
                      <tr key={p.guardId}>
                        <td>{p.guardName}</td>
                        <td>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{width: `${p.attendanceRate}%`}}></div>
                            <span className="progress-text">{p.attendanceRate}%</span>
                          </div>
                        </td>
                        <td><span className="badge-primary">{p.allocationsCompleted}</span></td>
                        <td><span className="badge-secondary">{p.maintenanceCompleted}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="empty-state">No performance data available</p>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

export default PerformanceDashboard
