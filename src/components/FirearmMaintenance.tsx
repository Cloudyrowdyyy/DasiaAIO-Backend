import { useState, useEffect, FC } from 'react'
import Logo from './Logo'
import { API_BASE_URL } from '../config'
import '../styles/FirearmMaintenance.css'

interface Maintenance {
  id: string
  firearmId: string
  maintenanceType: string
  maintenanceDate: string
  nextScheduledDate?: string
  status: string
  notes?: string
  [key: string]: any
}

interface Props {
  user: any
  onLogout: () => void
  onViewChange?: (view: string) => void
}

const FirearmMaintenance: FC<Props> = ({ user, onLogout, onViewChange }) => {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    fetchMaintenances()
  }, [])

  const fetchMaintenances = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/firearm-maintenance`)
      if (response.ok) {
        const data = await response.json()
        setMaintenances(data.maintenances || [])
      }
    } catch (err) {
      console.error('Error fetching maintenance records:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNavigate = (view: string) => {
    if (onViewChange) {
      onViewChange(view)
    }
  }

  const isOverdue = (nextDate: string | undefined) => {
    if (!nextDate) return false
    return new Date(nextDate) < new Date()
  }

  return (
    <div className="firearm-maintenance">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Logo />
        </div>
        <nav className="sidebar-menu">
          <button className="nav-btn" onClick={() => handleNavigate('users')}>
            Dashboard
          </button>
          <button className="nav-btn" onClick={() => handleNavigate('performance')}>
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
          <button className="nav-btn active" onClick={() => handleNavigate('maintenance')}>
            Maintenance
          </button>
        </nav>
        <button onClick={onLogout} className="logout-btn-sidebar">Logout</button>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <h1>Firearm Maintenance</h1>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </header>

        {loading ? (
          <div className="loading">Loading maintenance records...</div>
        ) : (
          <div className="dashboard-content">
            <section className="maintenance-section">
              <h2>Maintenance Records ({maintenances.length})</h2>
              {maintenances.length > 0 ? (
                <table className="maintenance-table">
                  <thead>
                    <tr>
                      <th>Firearm ID</th>
                      <th>Type</th>
                      <th>Maintenance Date</th>
                      <th>Next Scheduled</th>
                      <th>Status</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenances.map((m) => (
                      <tr key={m.id} className={isOverdue(m.nextScheduledDate) ? 'overdue' : ''}>
                        <td>{m.firearmId}</td>
                        <td>{m.maintenanceType}</td>
                        <td>{new Date(m.maintenanceDate).toLocaleDateString()}</td>
                        <td>
                          <span className={isOverdue(m.nextScheduledDate) ? 'overdue-text' : ''}>
                            {m.nextScheduledDate ? new Date(m.nextScheduledDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${m.status?.toLowerCase()}`}>
                            {m.status}
                          </span>
                        </td>
                        <td>{m.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="empty-state">No maintenance records found</p>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

export default FirearmMaintenance
