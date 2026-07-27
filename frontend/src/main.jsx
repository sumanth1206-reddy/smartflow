import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from "react-hot-toast";
import App from './App'
import './styles/global.css'
import { AuthProvider } from './auth/AuthProvider'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
      <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            duration: 3000,
            className: 'glassy-toast',
          }}
        />
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
)
