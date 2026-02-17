import { FC } from 'react'
import './PerformanceDashboard.css'

interface User {
  [key: string]: any
}

interface Props {
  user: User
  onLogout: () => void
  onViewChange?: (view: string) => void
}

const PerformanceDashboard: FC<Props> = ({ user, onLogout }) => {
  return (
    <div className="performance-dashboard">
      <h1>Performance Dashboard</h1>
      <button onClick={onLogout}>Logout</button>
    </div>
  )
}

export default PerformanceDashboard
