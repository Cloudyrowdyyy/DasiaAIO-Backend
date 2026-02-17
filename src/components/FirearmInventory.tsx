import { useState, useEffect, FC } from 'react'
import Logo from './Logo'
import { API_BASE_URL } from '../config'
import '../styles/FirearmInventory.css'

interface Firearm {
  id: string
  serialNumber: string
  model: string
  type: string
  status: string
  lastMaintenance?: string
  [key: string]: any
}

interface Props {
  user: any
  onLogout: () => void
  onViewChange?: (view: string) => void
}

const FirearmInventory: FC<Props> = ({ user, onLogout, onViewChange }) => {
  const [firearms, setFirearms] = useState<Firearm[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    fetchFirearms()
  }, [])

  const fetchFirearms = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/firearms`)
      if (response.ok) {
        const data = await response.json()
        setFirearms(data.firearms || [])
      }
    } catch (err) {
      console.error('Error fetching firearms:', err)
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
    <div className="firearm-inventory">
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
          <button className="nav-btn active" onClick={() => handleNavigate('firearms')}>
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
          <h1>Firearm Inventory</h1>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </header>

        {loading ? (
          <div className="loading">Loading firearms...</div>
        ) : (
          <div className="dashboard-content">
            <section className="inventory-section">
              <h2>All Firearms ({firearms.length})</h2>
              {firearms.length > 0 ? (
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>Serial Number</th>
                      <th>Model</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Last Maintenance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {firearms.map((f) => (
                      <tr key={f.id}>
                        <td>{f.serialNumber}</td>
                        <td>{f.model}</td>
                        <td>{f.type}</td>
                        <td>
                          <span className={`status-badge ${f.status?.toLowerCase()}`}>
                            {f.status}
                          </span>
                        </td>
                        <td>{f.lastMaintenance ? new Date(f.lastMaintenance).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="empty-state">No firearms in inventory</p>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

export default FirearmInventory
