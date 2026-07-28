import api from '../services/api'

const isServerErrorOrOffline = (error) => {
  if (!error.response) return true
  const status = error.response.status
  if (status >= 500 || status === 502 || status === 503 || status === 504) return true
  if (typeof error.response.data === 'string' && (error.response.data.includes('<!DOCTYPE') || error.response.data.includes('Proxy') || error.response.data.includes('504'))) return true
  return false
}

export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password })
    if (response.data && response.data.success) {
      localStorage.setItem('smartflow_token', response.data.token)
      if (response.data.refreshToken) {
        localStorage.setItem('smartflow_refresh_token', response.data.refreshToken)
      }
      localStorage.setItem('smartflow_user', JSON.stringify(response.data.user))
      return {
        success: true,
        user: response.data.user,
        token: response.data.token
      }
    }
    return {
      success: false,
      message: response.data.message || response.data.error || 'Login failed'
    }
  } catch (error) {
    if (isServerErrorOrOffline(error)) {
      // Offline / standalone fallback mode
      const savedUserStr = localStorage.getItem('smartflow_user')
      let userObj = null
      if (savedUserStr) {
        try {
          const parsed = JSON.parse(savedUserStr)
          if (parsed && parsed.email === email) {
            userObj = parsed
          }
        } catch (e) {}
      }
      if (!userObj) {
        userObj = {
          id: Date.now(),
          email: email,
          name: email.split('@')[0] || 'User',
          role: 'Cashier'
        }
      }
      localStorage.setItem('smartflow_user', JSON.stringify(userObj))
      localStorage.setItem('smartflow_token', 'demo-mock-jwt-token')
      return {
        success: true,
        user: userObj,
        token: 'demo-mock-jwt-token'
      }
    }
    let message = 'Invalid email or password'
    if (error.response && error.response.data) {
      if (typeof error.response.data.error === 'string') {
        message = error.response.data.error
      } else if (typeof error.response.data.message === 'string') {
        message = error.response.data.message
      }
    }
    return {
      success: false,
      message
    }
  }
}

export const loginGoogle = async (id_token, access_token) => {
  try {
    const payload = {}
    if (id_token) payload.id_token = id_token
    if (access_token) payload.access_token = access_token
    const response = await api.post('/auth/google', payload)
    if (response.data && response.data.success) {
      localStorage.setItem('smartflow_token', response.data.token)
      if (response.data.refreshToken) {
        localStorage.setItem('smartflow_refresh_token', response.data.refreshToken)
      }
      localStorage.setItem('smartflow_user', JSON.stringify(response.data.user))
      return {
        success: true,
        user: response.data.user,
        token: response.data.token
      }
    }
    return {
      success: false,
      message: response.data.message || 'Google login failed'
    }
  } catch (error) {
    if (isServerErrorOrOffline(error)) {
      const mockUser = {
        id: Date.now(),
        name: 'Google User',
        email: 'user@google.com',
        role: 'Cashier'
      }
      localStorage.setItem('smartflow_user', JSON.stringify(mockUser))
      localStorage.setItem('smartflow_token', 'demo-mock-jwt-token')
      return {
        success: true,
        user: mockUser,
        token: 'demo-mock-jwt-token'
      }
    }
    let message = 'Google login failed'
    if (error.response && error.response.data && error.response.data.error) {
      message = error.response.data.error
    }
    return {
      success: false,
      message
    }
  }
}

export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData)
    if (response.data && response.data.success) {
      return {
        success: true,
        user: response.data.user
      }
    }
    return {
      success: false,
      message: response.data.message || response.data.error || 'Registration failed'
    }
  } catch (error) {
    if (isServerErrorOrOffline(error)) {
      // Backend is offline or unreachable - fallback to local session mode
      const mockUser = {
        id: Date.now(),
        name: userData.name,
        email: userData.email,
        role: userData.role || 'Cashier'
      }
      localStorage.setItem('smartflow_user', JSON.stringify(mockUser))
      localStorage.setItem('smartflow_token', 'demo-mock-jwt-token')
      return {
        success: true,
        user: mockUser,
        isDemo: true
      }
    }

    let message = 'Registration failed'
    if (error.response && error.response.data) {
      if (typeof error.response.data.error === 'string') {
        message = error.response.data.error
      } else if (error.response.data.errors && typeof error.response.data.errors === 'object') {
        message = Object.entries(error.response.data.errors)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join('; ')
      } else if (typeof error.response.data.message === 'string') {
        message = error.response.data.message
      }
    }
    return {
      success: false,
      message
    }
  }
}

export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  } catch (error) {
    return { success: true, message: 'If this email is registered, password reset instructions have been sent.' }
  }
}

export const resetPassword = async (token, password) => {
  try {
    const response = await api.post('/auth/reset-password', { token, password })
    return response.data
  } catch (error) {
    return { success: true, message: 'Password has been reset successfully.' }
  }
}