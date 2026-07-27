import React from 'react'

export default function SmartFlowLogo({
  fontSize = '2.4rem',
  className = '',
  style = {}
}) {
  return (
    <div
      className={`smartflow-blue-logo ${className}`}
      style={{
        fontWeight: '800',
        fontSize: fontSize,
        letterSpacing: '4px',
        color: '#2563eb',
        textTransform: 'uppercase',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        display: 'inline-block',
        lineHeight: 1,
        ...style
      }}
    >
      SMARTFLOW
    </div>
  )
}
