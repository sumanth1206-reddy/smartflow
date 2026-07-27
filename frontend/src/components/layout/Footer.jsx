import React from 'react'
import SmartFlowLogo from '../common/SmartFlowLogo'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 24px' }}>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>Version 1.0.0 • © {year} SmartFlow</p>
    </footer>
  )
}
