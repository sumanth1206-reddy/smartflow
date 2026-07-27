import React from 'react'

export default function Pagination({ page, totalPages, onPageChange }) {
  return (
    <div className="pagination">
      <button type="button" className="btn btn-ghost" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        Previous
      </button>
      <span>Page {page} of {totalPages}</span>
      <button type="button" className="btn btn-ghost" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
        Next
      </button>
    </div>
  )
}
