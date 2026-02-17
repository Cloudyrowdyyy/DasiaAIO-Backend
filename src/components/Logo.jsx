import './Logo.css'

export default function Logo({ onClick }) {
  return (
    <div className="logo-container" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <img 
        src="/images/logo.png" 
        alt="Company Logo" 
        className="logo"
      />
    </div>
  )
}
