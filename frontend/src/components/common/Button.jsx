import React from 'react'
import { useTranslation } from 'react-i18next'

export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const { t } = useTranslation()
  const classes = ['btn', `btn-${variant}`, `btn-${size}`, className].filter(Boolean).join(' ')
  const translatedText = typeof children === 'string' ? t(children, children) : children

  return (
    <button className={classes} {...props}>
      {translatedText}
    </button>
  )
}
