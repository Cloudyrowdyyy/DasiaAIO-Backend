import { useState, FC, FormEvent, ChangeEvent } from 'react'
import Logo from './Logo'
import { User } from '../App'
import './LoginPage.css'

interface LoginPageProps {
  onLogin: (user: User) => void
}

// Format phone number to +63-###-###-####
function formatPhoneNumber(value: string): string {
  // Remove all non-digits
  let cleaned = value.replace(/\D/g, '')
  
  // If it starts with 0, replace with 63
  if (cleaned.startsWith('0')) {
    cleaned = '63' + cleaned.slice(1)
  }
  
  // Ensure it starts with 63
  if (!cleaned.startsWith('63')) {
    cleaned = '63' + cleaned
  }
  
  // Limit to 12 digits (63 + 10 digits)
  cleaned = cleaned.slice(0, 12)
  
  // Format as +63-###-###-####
  if (cleaned.length <= 2) {
    return '+' + cleaned
  } else if (cleaned.length <= 5) {
    return '+' + cleaned.slice(0, 2) + '-' + cleaned.slice(2)
  } else if (cleaned.length <= 8) {
    return '+' + cleaned.slice(0, 2) + '-' + cleaned.slice(2, 5) + '-' + cleaned.slice(5)
  } else {
    return '+' + cleaned.slice(0, 2) + '-' + cleaned.slice(2, 5) + '-' + cleaned.slice(5, 8) + '-' + cleaned.slice(8)
  }
}

const LoginPage: FC<LoginPageProps> = ({ onLogin }) => {
  const [identifier, setIdentifier] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [username, setUsername] = useState<string>('')
  const [fullName, setFullName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [phoneNumber, setPhoneNumber] = useState<string>('')
  const [licenseNumber, setLicenseNumber] = useState<string>('')
  const [licenseExpiryDate, setLicenseExpiryDate] = useState<string>('')
  const [role, setRole] = useState<string>('user')
  const [adminCode, setAdminCode] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isRegistering, setIsRegistering] = useState<boolean>(false)
  const [requiresVerification, setRequiresVerification] = useState<boolean>(false)
  const [verificationCode, setVerificationCode] = useState<string>('')
  const [verificationEmail, setVerificationEmail] = useState<string>('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
        console.log('Registration attempt:', { email, password, username, role, fullName, phoneNumber })
        
        if (!email || !password || !username || !role) {
          console.log('Missing basic fields:', { email: !email, password: !password, username: !username, role: !role })
          setError('All fields are required')
          setIsLoading(false)
          return
        }

        // Validate required fields
        if (!fullName || !phoneNumber) {
          console.log('Missing personal info:', { fullName: !fullName, phoneNumber: !phoneNumber })
          setError('Full name and phone number are required')
          setIsLoading(false)
          return
        }

        // For regular users, license fields are required
        if (role !== 'admin' && (!licenseNumber || !licenseExpiryDate)) {
          console.log('Missing license fields for user:', { licenseNumber: !licenseNumber, licenseExpiryDate: !licenseExpiryDate })
          setError('License number and expiry date are required for regular users')
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
        const requestBody: any = { 
          email, 
          password, 
          username, 
          role, 
          adminCode,
          fullName,
          phoneNumber
        }
        
        // Only include license fields if not admin
        if (role !== 'admin') {
          requestBody.licenseNumber = licenseNumber
          requestBody.licenseExpiryDate = licenseExpiryDate
        }
        
        console.log('Registering with:', requestBody)
        
        const response = await fetch('http://localhost:5000/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
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
          setIdentifier('')
          setEmail('')
          setPassword('')
          setUsername('')
          setFullName('')
          setPhoneNumber('')
          setLicenseNumber('')
          setLicenseExpiryDate('')
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
        if (!identifier || !password) {
          setError('Email, phone number, and password are required')
          setIsLoading(false)
          return
        }

        console.log('Attempting login with:', { identifier, password: '***' })

        // Call backend login
        const response = await fetch('http://localhost:5000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password })
        })

        console.log('Login response status:', response.status)

        if (!response.ok) {
          const data = await response.json()
          console.log('Login error data:', data)
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
        const user: User = {
          ...data.user,
          role: data.user.role as 'admin' | 'superadmin' | 'user' | 'guard'
        }
        onLogin(user)
      }
    } catch (err) {
      setError('Error: ' + (err instanceof Error ? err.message : String(err)))
      setIsLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="page-header" style={{ display: isRegistering ? 'none' : 'flex' }}>
        <Logo onClick={() => {}} />
        <span className="agency-name">Davao Security & Investigation Agency Inc.</span>
      </div>
      <div className="login-wrapper">
        <div className="login-left">
          <div className="login-content">
            {!requiresVerification && !isRegistering && (
              <div className="welcome-section">
                <h1>Welcome Back!</h1>
                <p>Please enter your details</p>
              </div>
            )}
            {requiresVerification ? (
              <>
                <div className="verify-header">
                  <h1>Verify Your Email</h1>
                  <p className="verification-subtitle">Enter the 6-digit code sent to {verificationEmail}</p>
                </div>
                <form onSubmit={handleSubmit} className="login-form">
                  <div className="form-group">
                    <label htmlFor="code">Confirmation Code</label>
                    <input
                      id="code"
                      type="text"
                      value={verificationCode}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setVerificationCode(e.target.value.slice(0, 6))}
                      placeholder="000000"
                      disabled={isLoading}
                      maxLength={6}
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
                          setError('Error: ' + (err instanceof Error ? err.message : String(err)))
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
                        setIdentifier('')
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
                {isRegistering && (
                  <div className="register-header">
                    <h1>Create Account</h1>
                    <p>Fill in your details to get started</p>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="login-form">
                  {isRegistering && (
                    <div className="form-group">
                      <label htmlFor="username">Username</label>
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        disabled={isLoading}
                      />
                    </div>
                  )}

                  {isRegistering && (
                    <div className="form-group">
                      <label htmlFor="fullName">Full Name</label>
                      <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        disabled={isLoading}
                      />
                    </div>
                  )}

                  {isRegistering && (
                    <div className="form-group">
                      <label htmlFor="phoneNumber">Phone Number</label>
                      <input
                        id="phoneNumber"
                        type="text"
                        value={phoneNumber}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                        placeholder="+63-###-###-####"
                        disabled={isLoading}
                      />
                    </div>
                  )}

                  {isRegistering && role !== 'admin' && (
                    <div className="form-group">
                      <label htmlFor="licenseNumber">License Number</label>
                      <input
                        id="licenseNumber"
                        type="text"
                        value={licenseNumber}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setLicenseNumber(e.target.value)}
                        placeholder="Enter your license number"
                        disabled={isLoading}
                      />
                    </div>
                  )}

                  {isRegistering && role !== 'admin' && (
                    <div className="form-group">
                      <label htmlFor="licenseExpiryDate">License Expiry Date</label>
                      <input
                        id="licenseExpiryDate"
                        type="date"
                        value={licenseExpiryDate}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setLicenseExpiryDate(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  )}

                  {isRegistering && (
                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        disabled={isLoading}
                      />
                    </div>
                  )}

                  {!isRegistering && (
                    <div className="form-group">
                      <label htmlFor="identifier">Email or Phone Number</label>
                      <input
                        id="identifier"
                        type="text"
                        value={identifier}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setIdentifier(e.target.value)}
                        placeholder="Enter your email or phone number"
                        disabled={isLoading}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
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
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setRole(e.target.value)}
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
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setAdminCode(e.target.value)}
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
                      setIdentifier('')
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

        <div className="login-right">
          <img src="/images/security-bg.png" alt="Security" className="security-illustration" />
        </div>
      </div>
    </div>
  )
}

export default LoginPage
