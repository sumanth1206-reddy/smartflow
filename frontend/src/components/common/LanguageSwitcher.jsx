import React from 'react'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🌐' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', flag: '🌐' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🌐' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', flag: '🌐' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', flag: '🌐' }
]

export default function LanguageSwitcher({ className = '', style = {}, compact = false }) {
  const { i18n } = useTranslation()

  const currentLng = i18n.language?.split('-')[0] || 'en'

  const handleChange = (e) => {
    const newLng = e.target.value
    i18n.changeLanguage(newLng)
    localStorage.setItem('i18nextLng', newLng)
  }

  return (
    <div
      className={`language-switcher-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        ...style
      }}
    >
      <select
        value={currentLng}
        onChange={handleChange}
        aria-label="Select Language"
        className="language-select"
        style={{
          padding: compact ? '4px 8px' : '6px 12px',
          fontSize: compact ? '0.8rem' : '0.85rem',
          fontWeight: '600',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          background: 'var(--panel-soft, var(--card))',
          color: 'var(--text)',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: 'var(--shadow)',
          transition: 'all 180ms ease'
        }}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.native}
          </option>
        ))}
      </select>
    </div>
  )
}
