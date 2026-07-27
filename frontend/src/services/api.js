import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smartflow_token')
    if (token) {
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
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // Check if error status is 401 and request has not been retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // If the request itself was the refresh call, do not retry to prevent infinite loops
      if (originalRequest.url === '/auth/refresh') {
        localStorage.removeItem('smartflow_token')
        localStorage.removeItem('smartflow_refresh_token')
        localStorage.removeItem('smartflow_user')
        window.location.href = '/login'
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
          const res = await axios.post('/api/auth/refresh', {}, {
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
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      } else {
        localStorage.removeItem('smartflow_token')
        localStorage.removeItem('smartflow_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
