import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import { Login } from './pages/Login.jsx'
import { Signup } from './pages/Signup.jsx'
import { Dashboard } from './pages/innovator/Dashboard.jsx'
import { Feed } from './pages/investor/Feed.jsx'
import { Messages } from './pages/chat/Messages.jsx'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" replace />
}

function RequireRole({ role, children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return user.role === role ? children : <Navigate to={user.role === 'innovator' ? '/dashboard' : '/feed'} replace />
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to={user.role === 'innovator' ? '/dashboard' : '/feed'} replace /> : children
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />
      <Route path="/dashboard" element={<RequireRole role="innovator"><Dashboard /></RequireRole>} />
      <Route path="/feed" element={<RequireRole role="investor"><Feed /></RequireRole>} />
      <Route path="/messages" element={<RequireAuth><Messages /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
