import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth/AuthProvider'
import api from '../../services/api'
import SmartFlowLogo from '../common/SmartFlowLogo'
import LanguageSwitcher from '../common/LanguageSwitcher'

const labelMap = {
  '/': 'Dashboard',
  '/products': 'Products',
  '/categories': 'Categories',
  '/suppliers': 'Suppliers',
  '/inventory': 'Inventory',
  '/orders': 'Purchase Orders',
  '/billing': 'Billing',
  '/sales': 'Sales History',
  '/notifications': 'Notifications',
  '/reports': 'Reports',
  '/profile': 'Profile',
  '/settings': 'Settings'
}

function getIcon(type) {
  if (type?.toUpperCase() === 'WARNING') return '⚠';
  if (type?.toUpperCase() === 'SALE' || type?.toUpperCase() === 'INVOICE') return '🧾';
  if (type?.toUpperCase() === 'INVENTORY') return '📦';
  if (type?.toUpperCase() === 'AI') return '🤖';
  return '🔔';
}

function formatRelativeTime(dateString) {
  if (!dateString) return 'Just now'
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  return `${diffDay}d ago`
}

export default function Header({ darkMode, setDarkMode, sidebarOpen, setSidebarOpen }) {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])

  const pathKeyMap = {
    '/': 'dashboard',
    '/products': 'products',
    '/categories': 'categories',
    '/suppliers': 'suppliers',
    '/inventory': 'inventory',
    '/orders': 'orders',
    '/billing': 'billing',
    '/sales': 'sales',
    '/notifications': 'notifications',
    '/reports': 'reports',
    '/profile': 'profile',
    '/settings': 'settings'
  };
  const currentKey = pathKeyMap[location.pathname] || 'dashboard';
  const pageLabel = t(`nav.${currentKey}`, labelMap[location.pathname] || 'Dashboard');

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const response = await api.get('/notifications')
        setNotifications(response.data)
      } catch (err) {
        console.error('Failed to load header notifications', err)
      }
    }
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 5000)
    return () => clearInterval(interval)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const toggleMenu = (e) => {
    e.stopPropagation()
    setMenuOpen(prev => !prev)
    setNotificationsOpen(false)
  }

  const toggleNotifications = (e) => {
    e.stopPropagation()
    setNotificationsOpen(prev => !prev)
    setMenuOpen(false)
  }

  useEffect(() => {
    if (!menuOpen && !notificationsOpen) return

    const handleOutsideClick = () => {
      setMenuOpen(false)
      setNotificationsOpen(false)
    }

    document.addEventListener('click', handleOutsideClick)
    return () => document.removeEventListener('click', handleOutsideClick)
  }, [menuOpen, notificationsOpen])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const handleClearAll = async () => {
    try {
      const promises = notifications.filter(n => !n.read).map(n => api.put(`/notifications/${n.id}/read`))
      await Promise.all(promises)
      setNotifications([])
    } catch (err) {
      console.error('Failed to clear notifications', err)
    }
  }

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (err) {
      console.error('Failed to mark notification as read', err)
    }
  }

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          type="button"
          className="sidebar-trigger"
          title="Open Menu"
          onClick={(e) => {
            e.stopPropagation()
            setSidebarOpen(true)
          }}
        >
          ☰
        </button>
        <div className="topbar-left">
          <div>
            <p className="eyebrow">Operations Hub</p>
            <h1>{pageLabel}</h1>
          </div>
          <div className="breadcrumb">Home / {pageLabel}</div>
        </div>
      </div>
      
      <div className="topbar-middle">
        <SmartFlowLogo fontSize="1.4rem" />
      </div>

      <div className="topbar-tools">
        <button type="button" className="icon-btn" onClick={() => setDarkMode((value) => !value)}>
          {darkMode ? '☀️' : '🌙'}
        </button>
        <div className="notification-container">
          <button type="button" className="icon-btn notification-btn" onClick={toggleNotifications}>
            🔔{unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
          </button>
          {notificationsOpen ? (
            <div className="notification-panel" onClick={(e) => e.stopPropagation()}>
              <div className="notification-panel-header">
                <h3>Recent Alerts</h3>
                <button type="button" onClick={handleClearAll}>Clear all</button>
              </div>
              <div className="notification-panel-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No new alerts
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`notification-dropdown-item${item.read ? ' read' : ''}`}
                      onClick={() => handleMarkRead(item.id)}
                      style={{
                        cursor: 'pointer',
                        opacity: item.read ? 0.65 : 1,
                        display: 'flex',
                        gap: '10px',
                        padding: '10px 12px',
                        borderBottom: '1px solid var(--border)'
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>{getIcon(item.type)}</span>
                      <div className="notification-dropdown-item-content" style={{ flex: 1 }}>
                        <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text)', fontWeight: item.read ? '500' : '700' }}>
                          {item.title}
                        </strong>
                        <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--muted)', lineBreak: 'anywhere' }}>{item.message}</p>
                        <small style={{ display: 'block', marginTop: '4px', fontSize: '0.75rem', color: 'var(--muted)' }}>
                          {formatRelativeTime(item.createdAt)}
                        </small>
                      </div>
                      {!item.read && (
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent)', alignSelf: 'center' }} />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>
        <div className="user-menu">
          <button type="button" className="user-chip" onClick={toggleMenu}>
            <span className="avatar">{user?.name ?.split(" ").map((word) => word[0]).join("").toUpperCase() || "S"}</span>
           <div className="user-info">
              <span className="user-name">
              {user?.name || "User"}
              </span>
              <small className="user-role">
              {user?.role}
              </small>
            </div>
          </button>
          {menuOpen ? (
            <div className="user-menu-panel" onClick={(e) => e.stopPropagation()}>
            <Link
              to="/profile"
              className="menu-link"
              onClick={()=>setMenuOpen(false)}
            >

              My Profile

            </Link>

            <Link
              to="/settings"
              className="menu-link"
              onClick={()=>setMenuOpen(false)}
            >

              Settings

            </Link>
            <button
              type="button"
              className="menu-link menu-link-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
