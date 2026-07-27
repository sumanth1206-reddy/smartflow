import React from 'react'

export default function SearchBar({ placeholder = 'Search...', className = '', ...props }) {
  return (
    <label className={['search-bar', className].filter(Boolean).join(' ')}>
      <span className="search-bar-icon">⌕</span>
      <input type="search" placeholder={placeholder} {...props} />
    </label>
  )
}
