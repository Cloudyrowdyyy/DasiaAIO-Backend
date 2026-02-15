import { useState } from 'react'
import LoginPage from './components/LoginPage'
import AdminDashboard from './components/AdminDashboard'
import SuperadminDashboard from './components/SuperadminDashboard'
import UserDashboard from './components/UserDashboard'
import PerformanceDashboard from './components/PerformanceDashboard'
import FirearmInventory from './components/FirearmInventory'
import FirearmAllocation from './components/FirearmAllocation'
import GuardFirearmPermits from './components/GuardFirearmPermits'
import FirearmMaintenance from './components/FirearmMaintenance'
import './App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [activeView, setActiveView] = useState('users') // 'users', 'performance', 'firearms', 'allocation', 'permits', 'maintenance'

  const handleLogin = (userData) => {
    console.log('Login successful:', userData)
    setUser(userData)
    setIsLoggedIn(true)
    setActiveView('users')
  }

  const handleLogout = () => {
    setUser(null)
    setIsLoggedIn(false)
    setActiveView('users')
  }

  console.log('App rendering, isLoggedIn:', isLoggedIn, 'user:', user)

  return (
    <div className="app" style={{ minHeight: '100vh', width: '100%' }}>
      {!isLoggedIn ? (
        <LoginPage onLogin={handleLogin} />
      ) : user?.role === 'admin' ? (
        activeView === 'performance' ? (
          <PerformanceDashboard user={user} onLogout={handleLogout} onViewChange={setActiveView} />
        ) : activeView === 'firearms' ? (
          <FirearmInventory user={user} onLogout={handleLogout} onViewChange={setActiveView} />
        ) : activeView === 'allocation' ? (
          <FirearmAllocation user={user} onLogout={handleLogout} onViewChange={setActiveView} />
        ) : activeView === 'permits' ? (
          <GuardFirearmPermits user={user} onLogout={handleLogout} onViewChange={setActiveView} />
        ) : activeView === 'maintenance' ? (
          <FirearmMaintenance user={user} onLogout={handleLogout} onViewChange={setActiveView} />
        ) : (
          <SuperadminDashboard user={user} onLogout={handleLogout} onViewChange={setActiveView} />
        )
      ) : user?.role === 'admin' ? (
        activeView === 'performance' ? (
          <PerformanceDashboard user={user} onLogout={handleLogout} onViewChange={setActiveView} />
        ) : activeView === 'firearms' ? (
          <FirearmInventory user={user} onLogout={handleLogout} onViewChange={setActiveView} />
        ) : activeView === 'allocation' ? (
          <FirearmAllocation user={user} onLogout={handleLogout} onViewChange={setActiveView} />
        ) : activeView === 'permits' ? (
          <GuardFirearmPermits user={user} onLogout={handleLogout} onViewChange={setActiveView} />
        ) : activeView === 'maintenance' ? (
          <FirearmMaintenance user={user} onLogout={handleLogout} onViewChange={setActiveView} />
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
