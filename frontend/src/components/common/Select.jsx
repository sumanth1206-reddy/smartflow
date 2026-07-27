import React from 'react'

export default function Select({ label, className = '', children, ...props }) {
  return (
    <label className={['field', className].filter(Boolean).join(' ')}>
      {label ? <span className="field-label">{label}</span> : null}
      <select className="select" {...props}>
        {children}
      </select>
    </label>
  )
}
