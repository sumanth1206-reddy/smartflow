import React from 'react'

export default function Badge({ children, variant = 'neutral', className = '' }) {
  return <span className={['badge', `badge-${variant}`, className].filter(Boolean).join(' ')}>{children}</span>
}
