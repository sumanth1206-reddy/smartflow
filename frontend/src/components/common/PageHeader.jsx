import React from 'react'
import { useTranslation } from 'react-i18next'
import Button from './Button'

export default function PageHeader({ title, subtitle, action, onActionClick, children }) {
  const { t } = useTranslation()
  return (
    <div className="page-header">
      <div>
        <h2>{t(title, title)}</h2>
        {subtitle ? <p>{t(subtitle, subtitle)}</p> : null}
      </div>
      <div className="page-header-actions">
        {children}
        {action ? <Button onClick={onActionClick}>{t(action, action)}</Button> : null}
      </div>
    </div>
  )
}
