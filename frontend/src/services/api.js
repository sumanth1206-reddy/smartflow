import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smartflow_token')
    if (token && token !== 'demo-mock-jwt-token') {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => {
    // If backend endpoint returns HTML string (e.g. Vercel SPA rewrite fallback for /api), treat as error
    if (typeof response.data === 'string' && response.data.trim().startsWith('<!DOCTYPE')) {
      const htmlErr = new Error('Received HTML response instead of JSON. Backend URL may be unconfigured.')
      htmlErr.response = { ...response, status: 502, data: { error: 'Backend unreachable or HTML returned' } }
      return Promise.reject(htmlErr)
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Ignore 401 handling for demo/mock sessions
    const currentToken = localStorage.getItem('smartflow_token')
    if (currentToken === 'demo-mock-jwt-token') {
      return Promise.reject(error)
    }

    // Check if error status is 401 and request has not been retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // If the request itself was the refresh call, do not retry
      const isRefreshCall = originalRequest.url && originalRequest.url.includes('/auth/refresh')
      if (isRefreshCall) {
        localStorage.removeItem('smartflow_token')
        localStorage.removeItem('smartflow_refresh_token')
        localStorage.removeItem('smartflow_user')
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('smartflow_refresh_token')
      if (refreshToken) {
        try {
          const res = await axios.post((import.meta.env.VITE_API_URL || '/api') + '/auth/refresh', {}, {
            headers: { Authorization: `Bearer ${refreshToken}` }
          })
          const newToken = res.data.token
          localStorage.setItem('smartflow_token', newToken)
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          processQueue(null, newToken)
          isRefreshing = false
          return api(originalRequest)
        } catch (refreshError) {
          processQueue(refreshError, null)
          isRefreshing = false
          localStorage.removeItem('smartflow_token')
          localStorage.removeItem('smartflow_refresh_token')
          localStorage.removeItem('smartflow_user')
          return Promise.reject(refreshError)
        }
      } else {
        localStorage.removeItem('smartflow_token')
        localStorage.removeItem('smartflow_user')
      }
    }
    return Promise.reject(error)
  }
)

export default api

