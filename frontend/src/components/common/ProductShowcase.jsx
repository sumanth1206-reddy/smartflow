import React from 'react'
import { motion } from 'framer-motion'

export default function ProductShowcase() {
  const features = [
    {
      icon: '📦',
      title: 'Real-time Inventory Tracking',
      desc: 'Seamlessly track stock movements, SKUs, and warehouse locations in real time.',
      bg: 'rgba(37, 99, 235, 0.08)',
      borderColor: 'rgba(37, 99, 235, 0.2)'
    },
    {
      icon: '⚡',
      title: 'Instant POS & Quick Billing',
      desc: 'Process sales rapidly with automated tax calculations, digital invoices, and receipt printing.',
      bg: 'rgba(16, 185, 129, 0.08)',
      borderColor: 'rgba(16, 185, 129, 0.2)'
    },
    {
      icon: '🛡️',
      title: 'Role-Based Access Control',
      desc: 'Tailored permissions and secure access levels for Cashiers, Operations Managers, and Admins.',
      bg: 'rgba(139, 92, 246, 0.08)',
      borderColor: 'rgba(139, 92, 246, 0.2)'
    },
    {
      icon: '📋',
      title: 'Supplier & Order Operations',
      desc: 'Manage vendor relationships, purchase orders, and stock reordering efficiently.',
      bg: 'rgba(245, 158, 11, 0.08)',
      borderColor: 'rgba(245, 158, 11, 0.2)'
    }
  ]

  return (
    <div
      className="product-showcase-container"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
        width: '100%',
        marginTop: '24px'
      }}
    >
      {features.map((feature, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          style={{
            background: 'var(--panel)',
            border: `1px solid ${feature.borderColor || 'var(--border)'}`,
            borderRadius: '16px',
            padding: '20px',
            boxShadow: 'var(--card-shadow)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: feature.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem'
            }}
          >
            {feature.icon}
          </div>
          <div>
            <h3
              style={{
                margin: '0 0 6px',
                fontSize: '0.98rem',
                fontWeight: '700',
                color: 'var(--text)',
                lineHeight: 1.3
              }}
            >
              {feature.title}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: '0.82rem',
                color: 'var(--muted)',
                lineHeight: 1.45
              }}
            >
              {feature.desc}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

