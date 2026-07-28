import React, { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Products from './pages/Products'
import Inventory from './pages/Inventory'
import Billing from './pages/Billing'
import Sales from './pages/Sales'
import Reports from './pages/Reports'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Categories from './pages/Categories'
import Suppliers from './pages/Suppliers'
import Orders from './pages/Orders'
import Notifications from './pages/Notifications'
import NotFound from './pages/NotFound'
import ProtectedRoute from './auth/ProtectedRoute'

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false
    const savedTheme = window.localStorage.getItem('smartflow-theme')
    return savedTheme === 'dark'
  })

  useEffect(() => {
    document.body.classList.toggle('dark-theme', darkMode)
    document.documentElement.classList.toggle('dark-theme', darkMode)
    window.localStorage.setItem('smartflow-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  return (
    <Routes>
      <Route path="/login" element={<Login darkMode={darkMode} setDarkMode={setDarkMode} />} />
      <Route path="/register" element={<Login isRegisterPage={true} darkMode={darkMode} setDarkMode={setDarkMode} />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout darkMode={darkMode} setDarkMode={setDarkMode} />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="categories" element={<Categories />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="orders" element={<Orders />} />
        <Route path="billing" element={<Billing />} />
        <Route path="sales" element={<Sales />} />
        <Route path="notifications" element={<Notifications />} />
        <Route
          path="reports"
          element={
            <ProtectedRoute roles={['Admin', 'Operations Manager']}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route path="profile" element={<Profile />} />
        <Route
          path="settings"
          element={
            <ProtectedRoute roles={['Admin']}>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
