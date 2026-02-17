import { FC } from 'react'
import './GuardDashboard.css'

interface User {
  [key: string]: any
}

interface GuardDashboardProps {
  user: User
  onLogout: () => void
  onViewChange?: (view: string) => void
}

const GuardDashboard: FC<GuardDashboardProps> = ({ user, onLogout }) => {
  return (
    <div className="guard-dashboard">
      <header className="dashboard-header">
        <h1>Guard Dashboard</h1>
        <button onClick={onLogout}>Logout</button>
      </header>
      <div className="content">
        <h2>Welcome, {user?.username}</h2>
      </div>
    </div>
  )
}

export default GuardDashboard
