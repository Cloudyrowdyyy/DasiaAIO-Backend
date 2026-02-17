import { useState, useEffect, FC } from 'react'
import Logo from './Logo'
import { API_BASE_URL } from '../config'
import '../styles/GuardFirearmPermits.css'

interface Permit {
  id: string
  guardId: string
  firearmId: string
  permitType: string
  issuedDate: string
  expiryDate: string
  status: string
  [key: string]: any
}

interface Props {
  user: any
  onLogout: () => void
  onViewChange?: (view: string) => void
}

const GuardFirearmPermits: FC<Props> = ({ user, onLogout, onViewChange }) => {
  const [permits, setPermits] = useState<Permit[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    fetchPermits()
  }, [])

  const fetchPermits = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/guard-firearm-permits`)
      if (response.ok) {
        const data = await response.json()
        setPermits(data.permits || [])
      }
    } catch (err) {
      console.error('Error fetching permits:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNavigate = (view: string) => {
    if (onViewChange) {
      onViewChange(view)
    }
  }

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date()
  }

  return (
    <div className="guard-firearm-permits">
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
          <button className="nav-btn active" onClick={() => handleNavigate('permits')}>
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
          <h1>Guard Firearm Permits</h1>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </header>

        {loading ? (
          <div className="loading">Loading permits...</div>
        ) : (
          <div className="dashboard-content">
            <section className="permits-section">
              <h2>Active Permits ({permits.length})</h2>
              {permits.length > 0 ? (
                <table className="permits-table">
                  <thead>
                    <tr>
                      <th>Guard ID</th>
                      <th>Firearm ID</th>
                      <th>Type</th>
                      <th>Issued Date</th>
                      <th>Expiry Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permits.map((p) => (
                      <tr key={p.id} className={isExpired(p.expiryDate) ? 'expired' : ''}>
                        <td>{p.guardId}</td>
                        <td>{p.firearmId}</td>
                        <td>{p.permitType}</td>
                        <td>{new Date(p.issuedDate).toLocaleDateString()}</td>
                        <td>
                          <span className={isExpired(p.expiryDate) ? 'expires-soon' : ''}>
                            {new Date(p.expiryDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${p.status?.toLowerCase()}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="empty-state">No permits found</p>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

export default GuardFirearmPermits
