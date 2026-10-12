import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Navbar, Footer } from '../components/layout/Navbar.jsx'
import { Button, Input, Field } from '../components/ui/index.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Lightbulb, Briefcase, Check } from 'lucide-react'

export function Signup() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { signup } = useAuth()

  const [role, setRole] = useState(searchParams.get('role') || '')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const r = searchParams.get('role')
    if (r === 'innovator' || r === 'investor') setRole(r)
  }, [searchParams])

  function validate() {
    const e = {}
    if (!role) e.role = 'Please pick a role.'
    if (!name.trim() || name.trim().length < 2) e.name = 'Enter your full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Enter a valid email.'
    if (!password || password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      e.password = 'At least 8 chars with a letter and number.'
    }
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const user = await signup({ role, name: name.trim(), email: email.trim(), password })
      navigate(user.role === 'innovator' ? '/dashboard' : '/feed')
    } catch (err) {
      if (err.code === 'EMAIL_TAKEN') {
        setErrors(prev => ({ ...prev, email: 'An account with this email already exists.' }))
      } else {
        setErrors(prev => ({ ...prev, role: err.message || 'Signup failed.' }))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-subtle">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6 py-12">
        <div className="w-full max-w-lg bg-surface border border-line rounded-2xl shadow-pop p-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-ink">Create your account</h1>
            <p className="text-xs text-ink-muted">Choose how you'll use Ventora</p>
          </div>

          {errors.role && (
            <div className="p-3 bg-danger-soft border border-danger/30 text-danger text-xs rounded-lg font-medium text-center">
              {errors.role}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => { setRole('innovator'); setErrors(p => ({ ...p, role: null })) }}
              className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                role === 'innovator'
                  ? 'border-primary bg-primary-soft/40 ring-2 ring-primary/20'
                  : 'border-line bg-surface hover:bg-surface-subtle'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
                  <Lightbulb className="w-5 h-5" />
                </div>
                {role === 'innovator' && (
                  <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">I'm an Innovator</h3>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Present your startup idea and connect with investors.
                </p>
              </div>
            </div>

            <div
              onClick={() => { setRole('investor'); setErrors(p => ({ ...p, role: null })) }}
              className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                role === 'investor'
                  ? 'border-primary bg-primary-soft/40 ring-2 ring-primary/20'
                  : 'border-line bg-surface hover:bg-surface-subtle'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-success flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                {role === 'investor' && (
                  <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">I'm an Investor</h3>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Discover matched startups and connect with founders.
                </p>
              </div>
            </div>
          </div>

          {role && (
            <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-line">
              <Field label="Full name" error={errors.name} required>
                <Input
                  type="text"
                  placeholder="e.g. Roshan Sharma"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  error={!!errors.name}
                />
              </Field>

              <Field label="Email address" error={errors.email} required>
                <Input
                  type="email"
                  placeholder="name@startup.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  error={!!errors.email}
                />
              </Field>

              <Field label="Password" helper="min. 8 chars with a letter and number" error={errors.password} required>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  error={!!errors.password}
                />
              </Field>

              <Field label="Confirm password" error={errors.confirmPassword} required>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  error={!!errors.confirmPassword}
                />
              </Field>

              <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full shadow-md">
                Create account
              </Button>
            </form>
          )}

          <div className="text-center text-xs text-ink-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
