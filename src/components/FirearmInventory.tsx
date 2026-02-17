import { FC } from 'react'
import './FirearmInventory.css'

interface Props {
  user: any
  onLogout: () => void
  onViewChange?: (view: string) => void
}

const FirearmInventory: FC<Props> = ({ user, onLogout }) => {
  return (
    <div className="firearm-inventory">
      <h1>Firearm Inventory</h1>
      <button onClick={onLogout}>Logout</button>
    </div>
  )
}

export default FirearmInventory
