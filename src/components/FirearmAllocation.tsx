import { FC } from 'react'
import './FirearmAllocation.css'

const FirearmAllocation: FC<any> = ({ user, onLogout }) => (
  <div className="firearm-allocation">
    <h1>Firearm Allocation</h1>
    <button onClick={onLogout}>Logout</button>
  </div>
)

export default FirearmAllocation
