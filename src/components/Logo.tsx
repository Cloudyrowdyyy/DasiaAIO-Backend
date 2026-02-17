import { FC, MouseEvent } from 'react'
import './Logo.css'

interface LogoProps {
  onClick?: (e: MouseEvent<HTMLDivElement>) => void
}

const Logo: FC<LogoProps> = ({ onClick }) => {
  return (
    <div 
      className="logo-container" 
      onClick={onClick} 
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <img 
        src="/images/logo.png" 
        alt="Company Logo" 
        className="logo"
      />
    </div>
  )
}

export default Logo
