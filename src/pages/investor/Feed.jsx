import React, { useEffect, useState } from 'react'
import { Navbar, Footer } from '../../components/layout/Navbar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { api } from '../../lib/api.js'

export function Feed() {
  const { user } = useAuth()
  const [ideas, setIdeas] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.ideas.list()
      .then(data => setIdeas(data.ideas))
      .catch(err => setError(err.message))
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-surface-subtle">
      <Navbar />
      <main className="flex-1 max-w-3xl w-full mx-auto p-6 py-10 space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-ink">Investor feed</h1>
          <p className="text-sm text-ink-muted mt-1">Published startup ideas for {user?.name}.</p>
        </header>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        {!error && ideas.length === 0 ? (
          <p className="text-sm text-ink-muted bg-surface border border-line rounded-xl p-5">No published ideas yet. Check back later.</p>
        ) : ideas.map(idea => (
          <article key={idea._id} className="bg-surface border border-line rounded-xl p-5">
            <p className="text-xs text-primary font-semibold">{idea.owner?.name || 'Innovator'}</p>
            <h2 className="text-lg font-bold text-ink mt-1">{idea.title}</h2>
            <p className="text-sm text-ink-secondary mt-2">{idea.pitch}</p>
          </article>
        ))}
      </main>
      <Footer />
    </div>
  )
}
