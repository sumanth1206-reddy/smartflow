import React from 'react'
import { motion } from 'framer-motion'

export default function ProductShowcase() {
  return (
    <div
      className="product-showcase-container"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
        width: '100%',
        marginTop: '20px'
      }}
    >
      {/* 1. Dashboard Summary Widget */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          gridColumn: 'span 2',
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '18px 20px',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)' }}>
            📊 Dashboard Overview
          </span>
          <h3 style={{ margin: '4px 0 0', fontSize: '1.4rem', fontWeight: '800', color: 'var(--text)' }}>
            ₹4,28,500.00
          </h3>
          <small style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Total Inventory Valuation</small>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ background: 'rgba(22, 163, 74, 0.12)', color: '#16a34a', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700' }}>
            ↑ +18.4%
          </span>
          <p style={{ margin: '6px 0 0', fontSize: '0.82rem', fontWeight: '600', color: 'var(--text)' }}>
            1,842 Active SKUs
          </p>
        </div>
      </motion.div>

      {/* 2. Revenue Chart Widget */}
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text)' }}>Revenue Growth</span>
          <small style={{ color: '#16a34a', fontWeight: '700' }}>+24.8%</small>
        </div>
        <svg width="100%" height="42" viewBox="0 0 160 42">
          <path d="M0,35 Q30,10 60,25 T120,5 T160,2" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
          <path d="M0,35 Q30,10 60,25 T120,5 T160,2 L160,42 L0,42 Z" fill="rgba(37, 99, 235, 0.08)" />
        </svg>
      </motion.div>

      {/* 3. AI Forecast Widget */}
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4.0, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '1rem' }}>🤖</span>
          <strong style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: '700' }}>AI Forecast Alert</strong>
        </div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text)', fontWeight: '600', lineHeight: 1.35 }}>
          Reorder SmartWatch Pro +150 units in 4 days
        </p>
      </motion.div>

      {/* 4. Inventory Item Card */}
      <motion.div
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '14px 16px',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div style={{ fontSize: '1.4rem', padding: '8px', background: 'var(--panel-soft)', borderRadius: '10px' }}>
          🎧
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Wireless Headphones
          </strong>
          <small style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>142 units in stock</small>
        </div>
      </motion.div>

      {/* 5. Low Stock Widget */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5.0, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        style={{
          background: 'rgba(217, 119, 6, 0.08)',
          border: '1px solid rgba(217, 119, 6, 0.25)',
          borderRadius: '16px',
          padding: '14px 16px',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>⚠️</span>
        <div>
          <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--warning)', fontWeight: '700' }}>
            Low Stock Threshold
          </strong>
          <small style={{ color: 'var(--text)', fontSize: '0.74rem', opacity: 0.9 }}>3 Items Action Required</small>
        </div>
      </motion.div>

      {/* 6. Billing Screen Preview & 7. Analytics Graph */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4.4, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        style={{
          gridColumn: 'span 2',
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '16px 20px',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.2rem', padding: '8px', background: 'rgba(37, 99, 235, 0.08)', borderRadius: '10px' }}>🧾</span>
          <div>
            <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text)' }}>
              Invoice #SF-9042
            </strong>
            <small style={{ color: 'var(--muted)', fontSize: '0.76rem' }}>Customer: Apex Retailers — ₹1,420.00</small>
          </div>
        </div>
        <span style={{ background: 'rgba(22, 163, 74, 0.15)', color: '#16a34a', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700' }}>
          PAID
        </span>
      </motion.div>
    </div>
  )
}
