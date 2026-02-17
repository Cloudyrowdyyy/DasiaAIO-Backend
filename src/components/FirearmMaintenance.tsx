import { FC } from 'react'
import './FirearmMaintenance.css'

const FirearmMaintenance: FC<any> = ({ user, onLogout }) => (
  <div className="firearm-maintenance">
    <h1>Firearm Maintenance</h1>
    <button onClick={onLogout}>Logout</button>
  </div>
)

export default FirearmMaintenance
