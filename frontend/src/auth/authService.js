import api from '../services/api'

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
      message: response.data.message || 'Login failed'
    }
  } catch (error) {
    let message = 'Invalid email or password'
    if (!error.response) {
      message = 'Cannot connect to backend server. Please verify the backend and database are running.'
    } else if (error.response.data && error.response.data.error) {
      message = error.response.data.error
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
    let message = 'Google login failed'
    if (!error.response) {
      message = 'Cannot connect to backend server. Please verify the backend and database are running.'
    } else if (error.response.data && error.response.data.error) {
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
      message: response.data.message || 'Registration failed'
    }
  } catch (error) {
    let message = 'Registration failed'
    if (!error.response) {
      message = 'Cannot connect to backend server. Please verify the backend and database are running.'
    } else if (error.response.data) {
      if (error.response.data.error) {
        message = error.response.data.error
      } else if (error.response.data.errors) {
        message = Object.entries(error.response.data.errors)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join('; ')
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
    throw new Error(error.response?.data?.error || 'Failed to request password reset code.')
  }
}

export const resetPassword = async (token, password) => {
  try {
    const response = await api.post('/auth/reset-password', { token, password })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to reset password.')
  }
}