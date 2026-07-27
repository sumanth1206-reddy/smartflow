import React from 'react'

export default function Input({ label, hint, className = '', ...props }) {
  return (
    <label className={['field', className].filter(Boolean).join(' ')}>
      {label ? <span className="field-label">{label}</span> : null}
      <input className="input" {...props} />
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  )
}
