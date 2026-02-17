import { FC } from 'react'
import Logo from './Logo'
import './UserDashboard.css'

interface User {
  id: string
  email: string  
  [key: string]: any
}

interface UserDashboardProps {
  user: User
  onLogout: () => void
}

const UserDashboard: FC<UserDashboardProps> = ({ user, onLogout }) => {
  return (
    <div className="user-dashboard">
      <header className="dashboard-header">
        <Logo />
        <h1>Welcome, {user?.username}</h1>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </header>
      <div className="content">
        <h2>My Dashboard</h2>
        <p>Email: {user?.email}</p>
      </div>
    </div>
  )
}

export default UserDashboard
