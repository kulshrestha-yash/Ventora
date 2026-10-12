import React from 'react'
import { Navbar, Footer } from '../../components/layout/Navbar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { Button } from '../../components/ui/index.js'
import { useNavigate } from 'react-router-dom'

export function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-subtle">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-surface border border-line rounded-2xl shadow-pop p-8 space-y-4 text-center">
          <h1 className="text-2xl font-bold text-ink">Hey, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-ink-muted">You're logged in as an <span className="font-semibold text-ink">Innovator</span>.</p>
          <p className="text-xs text-ink-muted">More features coming soon.</p>
          <Button variant="secondary" onClick={handleLogout}>Sign out</Button>
        </div>
      </main>
      <Footer />
    </div>
  )
}
