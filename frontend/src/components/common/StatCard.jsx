import React from 'react'
import { useTranslation } from 'react-i18next'
import Card from './Card'

export default function StatCard({ title, value, detail, tone = 'primary' }) {
  const { t } = useTranslation()
  return (
    <Card className={`stat-card stat-card-${tone}`}>
      <div className="stat-card-top">
        <span className="stat-title">{t(title, title)}</span>
        <span className="stat-dot" />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-detail">{t(detail, detail)}</div>
    </Card>
  )
}
