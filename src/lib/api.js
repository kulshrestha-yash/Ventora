const BASE = 'http://localhost:5001/api'

function getToken() {
  return localStorage.getItem('ventora:token')
}

async function request(path, options = {}) {
  const token = getToken()
  let res

  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    })
  } catch {
    throw new Error(`Cannot reach the API at ${BASE}. Start it with "npm run server" and check the terminal for database errors.`)
  }

  const data = await res.json()
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed')
    err.code = data.code
    throw err
  }
  return data
}

export const api = {
  async signup({ name, email, password, role }) {
    const data = await request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role })
    })
    localStorage.setItem('ventora:token', data.token)
    return data.user
  },

  async login({ email, password }) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
    localStorage.setItem('ventora:token', data.token)
    return data.user
  },

  async me() {
    if (!getToken()) return null
    try {
      const data = await request('/auth/me')
      return data.user
    } catch {
      localStorage.removeItem('ventora:token')
      return null
    }
  },

  logout() {
    localStorage.removeItem('ventora:token')
  }
}
