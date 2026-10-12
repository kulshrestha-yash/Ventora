import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../lib/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.me().then(u => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  async function login(credentials) {
    const u = await api.login(credentials)
    setUser(u)
    return u
  }

  async function signup(data) {
    const u = await api.signup(data)
    setUser(u)
    return u
  }

  function logout() {
    api.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
