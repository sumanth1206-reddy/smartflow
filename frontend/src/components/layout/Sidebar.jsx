import React from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth/AuthProvider'
import SmartFlowLogo from '../common/SmartFlowLogo'

const links = [
  { key: "dashboard", label: "Dashboard", to: "/", icon: "🏠" },
  { key: "products", label: "Products", to: "/products", icon: "📦" },
  { key: "categories", label: "Categories", to: "/categories", icon: "📁" },
  { key: "suppliers", label: "Suppliers", to: "/suppliers", icon: "🤝" },
  { key: "inventory", label: "Inventory", to: "/inventory", icon: "📊" },
  { key: "orders", label: "Purchase Orders", to: "/orders", icon: "🛒" },
  { key: "billing", label: "Billing", to: "/billing", icon: "🧾" },
  { key: "sales", label: "Sales History", to: "/sales", icon: "💰" },
  { key: "notifications", label: "Notifications", to: "/notifications", icon: "🔔" },
  { key: "reports", label: "Reports", to: "/reports", icon: "📈", roles: ["Admin", "Operations Manager"] },
  { key: "settings", label: "Settings", to: "/settings", icon: "⚙️", roles: ["Admin"] },
  { key: "profile", label: "Profile", to: "/profile", icon: "👤" },
];

export default function Sidebar({ open, setOpen }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const userRole = user?.role || 'Cashier'
  const filteredLinks = links.filter(link => !link.roles || link.roles.includes(userRole))

  return (
    <>
      <aside
        className={`sidebar ${open ? 'open' : ''}`}
        onMouseLeave={() => setOpen(false)}
      >
        <div className="brand-block" style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
          <SmartFlowLogo fontSize="1.35rem" />
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.35' }}>
            {t('app.tagline')}
          </p>
        </div>
        <nav className="sidebar-nav">
          {filteredLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
              end={item.to === '/'}
              onClick={() => setOpen(false)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span>{t(`nav.${item.key}`, item.label)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="version-info">
            <strong>SmartFlow</strong>
            <small>Version 1.0.0</small>
          </div>
        </div>
      </aside>
      {open ? <div className="sidebar-backdrop" onClick={() => setOpen(false)} /> : null}
    </>
  )
}
