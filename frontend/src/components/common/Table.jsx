import React from 'react'
import { useTranslation } from 'react-i18next'

export default function Table({ columns, rows, emptyMessage = 'No records available.' }) {
  const { t } = useTranslation()
  if (!rows || rows.length === 0) {
    return <div className="empty-state">{t(emptyMessage, emptyMessage)}</div>
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{t(column.header, column.header)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || index}>
              {columns.map((column) => (
                <td key={`${row.id || index}-${column.key}`}>{column.render ? column.render(row) : row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
