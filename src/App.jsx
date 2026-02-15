import { useState } from 'react'
import LoginPage from './components/LoginPage'
import AdminDashboard from './components/AdminDashboard'
import UserDashboard from './components/UserDashboard'
import './App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)

  const handleLogin = (userData) => {
    setUser(userData)
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setUser(null)
    setIsLoggedIn(false)
  }

  return (
    <div className="app">
      {!isLoggedIn ? (
        <LoginPage onLogin={handleLogin} />
      ) : user?.role === 'admin' ? (
        <AdminDashboard user={user} onLogout={handleLogout} />
      ) : (
        <UserDashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  )
}

export default App
