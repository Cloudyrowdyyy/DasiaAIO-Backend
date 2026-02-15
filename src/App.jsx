import { useState } from 'react'
import LoginPage from './components/LoginPage'
import AdminDashboard from './components/AdminDashboard'
import SuperadminDashboard from './components/SuperadminDashboard'
import UserDashboard from './components/UserDashboard'
import PerformanceDashboard from './components/PerformanceDashboard'
import './App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [activeView, setActiveView] = useState('users') // 'users' or 'performance'

  const handleLogin = (userData) => {
    setUser(userData)
    setIsLoggedIn(true)
    setActiveView('users')
  }

  const handleLogout = () => {
    setUser(null)
    setIsLoggedIn(false)
    setActiveView('users')
  }

  return (
    <div className="app">
      {!isLoggedIn ? (
        <LoginPage onLogin={handleLogin} />
      ) : user?.role === 'superadmin' ? (
        activeView === 'performance' ? (
          <PerformanceDashboard user={user} onLogout={handleLogout} onViewChange={setActiveView} />
        ) : (
          <SuperadminDashboard user={user} onLogout={handleLogout} onViewChange={setActiveView} />
        )
      ) : user?.role === 'admin' ? (
        activeView === 'performance' ? (
          <PerformanceDashboard user={user} onLogout={handleLogout} onViewChange={setActiveView} />
        ) : (
          <AdminDashboard user={user} onLogout={handleLogout} />
        )
      ) : (
        <UserDashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  )
}

export default App
