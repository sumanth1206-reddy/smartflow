import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import Loader from '../components/common/Loader'

export default function ProtectedRoute({ children, roles }) {
  const { user, initialized } = useAuth()
  
  if (!initialized) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
        <Loader label="Restoring session..." />
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  
  return children
}
