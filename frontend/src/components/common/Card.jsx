import React from 'react'
import { useTranslation } from 'react-i18next'

export default function Card({ title, subtitle, action, children, className = '' }) {
  const { t } = useTranslation()
  return (
    <section className={['card', className].filter(Boolean).join(' ')}>
      {(title || subtitle || action) && (
        <div className="card-header">
          <div>
            {title ? <h3>{t(title, title)}</h3> : null}
            {subtitle ? <p>{t(subtitle, subtitle)}</p> : null}
          </div>
          {action ? <div className="card-action">{action}</div> : null}
        </div>
      )}
      <div className="card-body">{children}</div>
    </section>
  )
}
