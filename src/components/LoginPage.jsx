import { useState } from 'react'
import Logo from './Logo'
import './LoginPage.css'

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('user')
  const [adminCode, setAdminCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [requiresVerification, setRequiresVerification] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [verificationEmail, setVerificationEmail] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (requiresVerification) {
        // Verify email code
        if (!verificationCode) {
          setError('Please enter the verification code')
          setIsLoading(false)
          return
        }

        const response = await fetch('http://localhost:5000/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: verificationEmail, code: verificationCode })
        })

        if (!response.ok) {
          const data = await response.json()
          setError(data.error || 'Verification failed')
          setIsLoading(false)
          return
        }

        setError('Email verified! You can now login.')
        setRequiresVerification(false)
        setVerificationCode('')
        setVerificationEmail('')
        setIsLoading(false)
        return
      }

      if (isRegistering) {
        // Register
        if (!email || !password || !username || !role) {
          setError('All fields are required')
          setIsLoading(false)
          return
        }

        if (!email.endsWith('@gmail.com')) {
          setError('You must use a Gmail account (email must end with @gmail.com)')
          setIsLoading(false)
          return
        }

        if (role === 'admin' && !adminCode) {
          setError('Admin code is required for admin account')
          setIsLoading(false)
          return
        }

        if (role === 'admin' && adminCode !== '122601') {
          setError('Invalid admin code')
          setIsLoading(false)
          return
        }

        if (password.length < 6) {
          setError('Password must be at least 6 characters')
          setIsLoading(false)
          return
        }

        // Call backend register
        const response = await fetch('http://localhost:5000/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, username, role, adminCode })
        })

        if (!response.ok) {
          const data = await response.json()
          setError(data.error || 'Registration failed')
          setIsLoading(false)
          return
        }

        const data = await response.json()
        if (data.requiresVerification) {
          setRequiresVerification(true)
          setVerificationEmail(email)
          setError('Check your Gmail for the confirmation code!')
          setEmail('')
          setPassword('')
          setUsername('')
          setAdminCode('')
          setIsLoading(false)
          return
        }

        setIsRegistering(false)
        setPassword('')
        setError('Registration successful! Please login.')
        setIsLoading(false)
        return
      } else {
        // Login
        if (!email || !password) {
          setError('Email and password are required')
          setIsLoading(false)
          return
        }

        // Call backend login
        const response = await fetch('http://localhost:5000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })

        if (!response.ok) {
          const data = await response.json()
          if (data.requiresVerification) {
            setRequiresVerification(true)
            setVerificationEmail(email)
            setError('Please verify your email first. Check your Gmail for the confirmation code.')
            setPassword('')
            setIsLoading(false)
            return
          }
          setError(data.error || 'Login failed')
          setIsLoading(false)
          return
        }

        const data = await response.json()
        setIsLoading(false)
        onLogin(data.user)
      }
    } catch (err) {
      setError('Error: ' + err.message)
      setIsLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <Logo />
        {requiresVerification ? (
          <>
            <h1>Verify Your Email</h1>
            <p className="verification-subtitle">Enter the 6-digit code sent to {verificationEmail}</p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="code">Confirmation Code</label>
                <input
                  id="code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.slice(0, 6))}
                  placeholder="000000"
                  disabled={isLoading}
                  maxLength="6"
                  className="verification-input"
                />
              </div>

              {error && (
                <div className={`message ${error.includes('verified successfully') ? 'success-message' : 'error-message'}`}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={isLoading} className="login-button">
                {isLoading ? 'Verifying...' : 'Verify'}
              </button>

              <div className="footer">
                <button
                  type="button"
                  className="resend-btn"
                  onClick={async () => {
                    setIsLoading(true)
                    try {
                      const response = await fetch('http://localhost:5000/api/resend-code', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: verificationEmail })
                      })
                      const data = await response.json()
                      setError(data.message || 'Code resent!')
                    } catch (err) {
                      setError('Error: ' + err.message)
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                  disabled={isLoading}
                >
                  Resend Code
                </button>
                <button
                  type="button"
                  className="toggle-btn"
                  onClick={() => {
                    setRequiresVerification(false)
                    setVerificationCode('')
                    setVerificationEmail('')
                    setError('')
                    setIsRegistering(false)
                  }}
                  disabled={isLoading}
                >
                  Back to Login
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h1>{isRegistering ? 'Register' : 'Login'}</h1>
        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={isLoading}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>

          {isRegistering && (
            <div className="form-group">
              <label htmlFor="role">Account Type</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={isLoading}
                className="role-select"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          {isRegistering && role === 'admin' && (
            <div className="form-group">
              <label htmlFor="adminCode">Admin Code</label>
              <input
                id="adminCode"
                type="password"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                placeholder="Enter admin code"
                disabled={isLoading}
              />
            </div>
          )}

          {error && (
            <div className={`message ${isRegistering && !error.includes('successful') ? 'error-message' : error.includes('successful') ? 'success-message' : 'error-message'}`}>
              {error}
            </div>
          )}

          <button type="submit" disabled={isLoading} className="login-button">
            {isLoading ? 'Processing...' : isRegistering ? 'Create Account' : 'Login'}
          </button>
        </form>

        <div className="footer">
          <button
            type="button"
            className="toggle-btn"
            onClick={() => {
              setIsRegistering(!isRegistering)
              setError('')
              setPassword('')
              setAdminCode('')
            }}
            disabled={isLoading}
          >
            {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  )
}
