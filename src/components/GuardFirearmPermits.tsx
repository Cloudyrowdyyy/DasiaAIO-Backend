import { FC } from 'react'
import './GuardFirearmPermits.css'

const GuardFirearmPermits: FC<any> = ({ user, onLogout }) => (
  <div className="guard-firearm-permits">
    <h1>Guard Firearm Permits</h1>
    <button onClick={onLogout}>Logout</button>
  </div>
)

export default GuardFirearmPermits
