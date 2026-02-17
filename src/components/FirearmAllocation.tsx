import { useState, useEffect, FC } from 'react'
import Logo from './Logo'
import { API_BASE_URL } from '../config'
import '../styles/FirearmAllocation.css'

interface Allocation {
  id: string
  guardId: string
  firearmId: string
  allocationDate: string
  status: string
  [key: string]: any
}

interface Props {
  user: any
  onLogout: () => void
  onViewChange?: (view: string) => void
}

const FirearmAllocation: FC<Props> = ({ onLogout, onViewChange }) => {
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    fetchAllocations()
  }, [])

  const fetchAllocations = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/firearm-allocations`)
      if (response.ok) {
        const data = await response.json()
        setAllocations(data.allocations || [])
      }
    } catch (err) {
      console.error('Error fetching allocations:', err)
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
    <div className="firearm-allocation">
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
          <button className="nav-btn active" onClick={() => handleNavigate('allocation')}>
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
          <h1>Firearm Allocation</h1>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </header>

        {loading ? (
          <div className="loading">Loading allocations...</div>
        ) : (
          <div className="dashboard-content">
            <section className="allocation-section">
              <h2>Firearm Allocations ({allocations.length})</h2>
              {allocations.length > 0 ? (
                <table className="allocation-table">
                  <thead>
                    <tr>
                      <th>Guard ID</th>
                      <th>Firearm ID</th>
                      <th>Allocation Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocations.map((a) => (
                      <tr key={a.id}>
                        <td>{a.guardId}</td>
                        <td>{a.firearmId}</td>
                        <td>{new Date(a.allocationDate).toLocaleDateString()}</td>
                        <td>
                          <span className={`status-badge ${a.status?.toLowerCase()}`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="empty-state">No allocations found</p>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

export default FirearmAllocation
