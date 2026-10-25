import React, { useEffect, useState } from 'react'
import { Navbar, Footer } from '../../components/layout/Navbar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { Button, Input, Field, Textarea } from '../../components/ui/index.js'
import { api } from '../../lib/api.js'

export function Dashboard() {
  const { user } = useAuth()
  const [ideas, setIdeas] = useState([])
  const [title, setTitle] = useState('')
  const [pitch, setPitch] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.ideas.list()
      .then(data => setIdeas(data.ideas))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function createIdea(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const { idea } = await api.ideas.create({ title, pitch })
      setIdeas([idea, ...ideas])
      setTitle('')
      setPitch('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-subtle">
      <Navbar />
      <main className="flex-1 max-w-3xl w-full mx-auto p-6 py-10 space-y-8">
        <header>
          <h1 className="text-2xl font-bold text-ink">Welcome, {user?.name}</h1>
          <p className="text-sm text-ink-muted mt-1">Share a short startup idea with investors.</p>
        </header>

        <form onSubmit={createIdea} className="bg-surface border border-line rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-ink">Share an idea</h2>
          <Field label="Title" id="idea-title" required>
            <Input id="idea-title" value={title} onChange={e => setTitle(e.target.value)} maxLength={80} required minLength={3} />
          </Field>
          <Field label="Short pitch" id="idea-pitch" helper="Up to 300 characters" required>
            <Textarea id="idea-pitch" value={pitch} onChange={e => setPitch(e.target.value)} maxLength={300} required rows={3} />
          </Field>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <Button type="submit" loading={saving}>Share idea</Button>
        </form>

        <section className="space-y-3">
          <h2 className="font-semibold text-ink">Your ideas</h2>
          {loading ? <p className="text-sm text-ink-muted">Loading ideas…</p> : ideas.length === 0 ? (
            <p className="text-sm text-ink-muted bg-surface border border-line rounded-xl p-5">No ideas yet. Save your first draft above.</p>
          ) : ideas.map(idea => (
            <article key={idea._id} className="bg-surface border border-line rounded-xl p-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-ink">{idea.title}</h3>
                <p className="text-sm text-ink-secondary mt-1">{idea.pitch}</p>
                <p className="text-xs text-ink-muted mt-2">Shared with investors</p>
              </div>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  )
}
