import React, { useEffect, useState } from 'react'
import { jsPDF } from 'jspdf'
import PageHeader from '../components/common/PageHeader'
import Card from '../components/common/Card'
import Select from '../components/common/Select'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import Input from '../components/common/Input'
import Table from '../components/common/Table'
import Badge from '../components/common/Badge'
import { formatPrice, getPdfSafePrice } from '../utils/currency'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function Reports() {
  const [reportType, setReportType] = useState('sales')
  
  // Filter states
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [category, setCategory] = useState('All')
  const [supplierId, setSupplierId] = useState('All')
  const [productId, setProductId] = useState('All')

  // Lists for filters
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])

  // Report results
  const [reportData, setReportData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function loadFilters() {
      try {
        const [catRes, supRes, prodRes] = await Promise.all([
          api.get('/categories'),
          api.get('/suppliers'),
          api.get('/products')
        ])
        setCategories(catRes.data)
        setSuppliers(supRes.data)
        setProducts(prodRes.data)
      } catch (err) {
        console.error('Failed to load report filter items', err)
      }
    }
    loadFilters()
  }, [])

  async function fetchReport() {
    setIsLoading(true)
    try {
      const response = await api.get('/reports/data', {
        params: {
          reportType,
          startDate,
          endDate,
          category: category === 'All' ? '' : category,
          supplierId: supplierId === 'All' ? '' : supplierId,
          productId: productId === 'All' ? '' : productId
        }
      })
      setReportData(response.data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load report data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [reportType, startDate, endDate, category, supplierId, productId])

  // Get table column structures dynamically based on active report type
  const getTableColumns = () => {
    switch (reportType) {
      case 'sales':
        return [
          { key: 'id', header: 'Invoice ID', width: 22 },
          { key: 'date', header: 'Date', width: 30 },
          { key: 'customer', header: 'Customer', width: 28 },
          { key: 'items', header: 'Items Sold', width: 45 },
          { key: 'paymentMethod', header: 'Payment Method', width: 22 },
          { key: 'total', header: 'Total', width: 18, render: (r) => formatPrice(r.total) },
          { key: 'status', header: 'Status', width: 17, render: (r) => <Badge variant={r.status === 'Paid' ? 'success' : 'warning'}>{r.status}</Badge> }
        ]
      case 'inventory':
        return [
          { key: 'name', header: 'Product Name', width: 30 },
          { key: 'sku', header: 'SKU', width: 20 },
          { key: 'category', header: 'Category', width: 25 },
          { key: 'supplier', header: 'Supplier', width: 28 },
          { key: 'price', header: 'Retail Price', width: 20, render: (r) => formatPrice(r.price) },
          { key: 'costPrice', header: 'Cost Price', width: 20, render: (r) => formatPrice(r.costPrice) },
          { key: 'stock', header: 'Stock Level', width: 18 },
          { key: 'value', header: 'Valuation', width: 21, render: (r) => formatPrice(r.value) }
        ]
      case 'profit':
        return [
          { key: 'invoice_id', header: 'Invoice ID', width: 22 },
          { key: 'date', header: 'Date', width: 30 },
          { key: 'product', header: 'Product', width: 35 },
          { key: 'qty', header: 'Quantity', width: 18 },
          { key: 'revenue', header: 'Revenue', width: 21, render: (r) => formatPrice(r.revenue) },
          { key: 'cost', header: 'COGS', width: 21, render: (r) => formatPrice(r.cost) },
          { key: 'profit', header: 'Gross Profit', width: 21, render: (r) => formatPrice(r.profit) },
          { key: 'margin', header: 'Margin %', width: 16, render: (r) => `${r.margin}%` }
        ]
      case 'performance':
        return [
          { key: 'rank', header: 'Rank', width: 12 },
          { key: 'id', header: 'Product ID', width: 18 },
          { key: 'name', header: 'Product Name', width: 45 },
          { key: 'sku', header: 'SKU', width: 25 },
          { key: 'category', header: 'Category', width: 30 },
          { key: 'unitsSold', header: 'Units Sold', width: 25 },
          { key: 'revenue', header: 'Revenue Generated', width: 27, render: (r) => formatPrice(r.revenue) }
        ]
      case 'supplier':
        return [
          { key: 'id', header: 'Supplier ID', width: 20 },
          { key: 'name', header: 'Supplier Name', width: 40 },
          { key: 'contact', header: 'Contact Person', width: 35 },
          { key: 'phone', header: 'Phone Number', width: 32 },
          { key: 'skus', header: 'SKUs Supplied', width: 22 },
          { key: 'stock', header: 'Units Supplied', width: 20 },
          { key: 'value', header: 'Cost Valuation', width: 13, render: (r) => formatPrice(r.value) }
        ]
      case 'customer':
        return [
          { key: 'customer', header: 'Customer Name', width: 55 },
          { key: 'transactions', header: 'Transactions', width: 35 },
          { key: 'totalSpent', header: 'Total Spent', width: 45, render: (r) => formatPrice(r.totalSpent) },
          { key: 'avgOrderValue', header: 'Avg Order Value', width: 47, render: (r) => formatPrice(r.avgOrderValue) }
        ]
      case 'monthly':
        return [
          { key: 'month', header: 'Month', width: 60 },
          { key: 'transactions', header: 'Transactions', width: 50 },
          { key: 'revenue', header: 'Revenue Generated', width: 72, render: (r) => formatPrice(r.revenue) }
        ]
      case 'daily':
        return [
          { key: 'date', header: 'Date', width: 60 },
          { key: 'transactions', header: 'Transactions', width: 50 },
          { key: 'revenue', header: 'Revenue Generated', width: 72, render: (r) => formatPrice(r.revenue) }
        ]
      default:
        return []
    }
  }

  const rows = reportData?.rows || []

  async function handleDownloadCSV() {
    try {
      const response = await api.get('/reports/export', {
        params: {
          reportType,
          startDate,
          endDate,
          category: category === 'All' ? '' : category,
          supplierId: supplierId === 'All' ? '' : supplierId,
          productId: productId === 'All' ? '' : productId
        },
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${reportType}_report.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Report exported to CSV successfully!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to export CSV report')
    }
  }

  const generatePDF = () => {
    if (!reportData || !reportData.rows || reportData.rows.length === 0) {
      toast.error('No report data to print')
      return
    }

    const doc = new jsPDF()

    // Header Banner
    doc.setFillColor(37, 99, 235) // #2563eb
    doc.rect(0, 0, 210, 40, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text(`SmartFlow: ${reportType.toUpperCase()} REPORT`, 14, 24)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(239, 246, 255)
    doc.text(`Generated: ${new Date().toLocaleDateString()} | SmartFlow Operational Hub`, 14, 32)

    // Draw active filters
    let filterY = 50
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text(`Date Range: ${startDate || 'All'} to ${endDate || 'All'} | Category: ${category} | Supplier: ${supplierId}`, 14, filterY)

    // Summary block
    let summaryY = 58
    doc.setFillColor(248, 250, 252)
    doc.rect(14, summaryY, 182, 18, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.rect(14, summaryY, 182, 18)

    let summaryX = 20
    Object.entries(reportData.summary || {}).forEach(([key, val]) => {
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(148, 163, 184)
      doc.text(key.toUpperCase(), summaryX, summaryY + 6)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(15, 23, 42)
      doc.text(typeof val === 'number' && (key.toLowerCase().includes('revenue') || key.toLowerCase().includes('valuation') || key.toLowerCase().includes('profit') || key.toLowerCase().includes('spend') || key.toLowerCase().includes('value')) ? getPdfSafePrice(val) : String(val), summaryX, summaryY + 12)

      summaryX += 45
    })

    // Table Columns
    let y = 84
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setFillColor(241, 245, 249)
    doc.rect(14, y, 182, 8, 'F')

    const cols = getTableColumns()
    let xOffset = 16
    doc.setTextColor(51, 65, 85)
    cols.forEach(col => {
      doc.text(col.header, xOffset, y + 6)
      xOffset += col.width || 25
    })

    y += 8
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)

    reportData.rows.forEach((row, idx) => {
      if (y > 270) {
        doc.addPage()
        y = 20
        doc.setFillColor(241, 245, 249)
        doc.rect(14, y, 182, 8, 'F')
        let pageXOffset = 16
        doc.setFont('helvetica', 'bold')
        cols.forEach(col => {
          doc.text(col.header, pageXOffset, y + 6)
          pageXOffset += col.width || 25
        })
        y += 8
        doc.setFont('helvetica', 'normal')
      }

      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252)
        doc.rect(14, y, 182, 8, 'F')
      }

      let rowXOffset = 16
      doc.setTextColor(15, 23, 42)
      cols.forEach(col => {
        let textVal = ''
        if (['total', 'price', 'costPrice', 'value', 'revenue', 'cost', 'profit', 'totalSpent', 'avgOrderValue'].includes(col.key)) {
          textVal = getPdfSafePrice(row[col.key])
        } else if (col.key === 'margin') {
          textVal = `${row[col.key]}%`
        } else {
          textVal = String(row[col.key] || '')
        }

        // Limit text length dynamically based on column width to prevent overlapping
        const maxChars = Math.max(8, Math.floor((col.width || 25) * 0.7))
        if (textVal.length > maxChars) {
          textVal = textVal.substring(0, maxChars - 3) + '...'
        }
        doc.text(textVal, rowXOffset, y + 6)
        rowXOffset += col.width || 25
      })

      y += 8
    })

    // Footer
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text('Confidential - For Internal Use Only', 14, 285)

    const filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(filename)
    toast.success('Report PDF downloaded successfully!')
  }

  // Helper to render responsive SVG charts based on loaded reportType data
  const renderDynamicChart = () => {
    if (!reportData || !reportData.chartData) {
      return (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0' }}>
          No trend data found for this report configuration.
        </div>
      )
    }

    const { labels, values, revenue, profit } = reportData.chartData

    if (['sales', 'monthly', 'daily'].includes(reportType)) {
      // Line chart representation
      if (!labels || labels.length === 0) return <div style={{ textAlign: 'center', padding: '24px 0' }}>No data to plot</div>
      const maxVal = Math.max(...values, 100)
      const points = values.map((val, idx) => {
        const x = 50 + (idx * (400 / Math.max(1, labels.length - 1)))
        const y = 170 - (val / maxVal * 130)
        return { x, y, val, label: labels[idx] }
      })
      const pathD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
      const fillD = points.length > 0 ? `${pathD} L ${points[points.length - 1].x} 170 L ${points[0].x} 170 Z` : ''

      return (
        <svg viewBox="0 0 500 220" width="100%" height="100%" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          {/* Horizontal lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => (
            <line key={idx} x1="45" y1={170 - p * 130} x2="460" y2={170 - p * 130} stroke="rgba(148, 163, 184, 0.12)" strokeWidth="1" />
          ))}
          {/* Y Axis labels */}
          <text x="35" y="174" fill="var(--muted)" fontSize="9" textAnchor="end">0</text>
          <text x="35" y="112" fill="var(--muted)" fontSize="9" textAnchor="end">{formatPrice(maxVal / 2)}</text>
          <text x="35" y="44" fill="var(--muted)" fontSize="9" textAnchor="end">{formatPrice(maxVal)}</text>

          {fillD && <path d={fillD} fill="url(#chartGrad)" />}
          {pathD && <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
          
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="4" fill="var(--accent)" stroke="var(--panel)" strokeWidth="1.5" />
              <title>{`${p.label}: ${formatPrice(p.val)}`}</title>
              {/* Show date label on x axis */}
              {idx % Math.ceil(labels.length / 6) === 0 && (
                <text x={p.x} y="188" fill="var(--muted)" fontSize="8.5" textAnchor="middle">
                  {p.label.length > 10 ? p.label.substring(5) : p.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      )
    }

    if (reportType === 'profit') {
      // Grouped double line/bar for revenue vs profit
      if (!labels || labels.length === 0) return <div style={{ textAlign: 'center', padding: '24px 0' }}>No data to plot</div>
      const maxVal = Math.max(...(revenue || [100]), ...(profit || [10]))
      const pointsRev = (revenue || []).map((val, idx) => ({
        x: 50 + (idx * (400 / Math.max(1, labels.length - 1))),
        y: 170 - (val / maxVal * 130),
        val,
        label: labels[idx]
      }))
      const pointsProf = (profit || []).map((val, idx) => ({
        x: 50 + (idx * (400 / Math.max(1, labels.length - 1))),
        y: 170 - (val / maxVal * 130),
        val,
        label: labels[idx]
      }))

      const pathRev = pointsRev.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
      const pathProf = pointsProf.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

      return (
        <svg viewBox="0 0 500 220" width="100%" height="100%" style={{ overflow: 'visible' }}>
          {[0, 0.5, 1].map((p, idx) => (
            <line key={idx} x1="45" y1={170 - p * 130} x2="460" y2={170 - p * 130} stroke="rgba(148, 163, 184, 0.12)" strokeWidth="1" />
          ))}
          <text x="35" y="174" fill="var(--muted)" fontSize="9" textAnchor="end">0</text>
          <text x="35" y="44" fill="var(--muted)" fontSize="9" textAnchor="end">{formatPrice(maxVal)}</text>

          {pathRev && <path d={pathRev} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />}
          {pathProf && <path d={pathProf} fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />}

          {pointsRev.map((p, idx) => (
            <circle key={idx} cx={p.x} cy={p.y} r="3.5" fill="var(--accent)" stroke="var(--panel)" strokeWidth="1">
              <title>{`Revenue: ${formatPrice(p.val)}`}</title>
            </circle>
          ))}
          {pointsProf.map((p, idx) => (
            <circle key={idx} cx={p.x} cy={p.y} r="3.5" fill="#22c55e" stroke="var(--panel)" strokeWidth="1">
              <title>{`Profit: ${formatPrice(p.val)}`}</title>
            </circle>
          ))}
          {labels.map((lbl, idx) => idx % Math.ceil(labels.length / 5) === 0 && (
            <text key={idx} x={50 + (idx * (400 / Math.max(1, labels.length - 1)))} y="188" fill="var(--muted)" fontSize="8.5" textAnchor="middle">
              {lbl}
            </text>
          ))}
        </svg>
      )
    }

    // Default: Horizontal bar chart for Categories and Top Lists
    if (!labels || labels.length === 0) return <div style={{ textAlign: 'center', padding: '24px 0' }}>No performance data to plot</div>
    const maxVal = Math.max(...values, 1)

    return (
      <svg viewBox="0 0 500 220" width="100%" height="100%" style={{ overflow: 'visible' }}>
        {labels.map((label, idx) => {
          const val = values[idx]
          const barWidth = (val / maxVal) * 320
          const y = 20 + idx * 38
          return (
            <g key={idx}>
              <text x="90" y={y + 11} fill="var(--foreground)" fontSize="9.5" fontWeight="500" textAnchor="end">
                {label.length > 13 ? label.substring(0, 10) + '...' : label}
              </text>
              <rect x="100" y={y} width="340" height="15" rx="3.5" fill="rgba(148, 163, 184, 0.08)" />
              <rect x="100" y={y} width={barWidth} height="15" rx="3.5" fill={idx % 2 === 0 ? 'var(--accent)' : '#38bdf8'} />
              <text x={108 + barWidth} y={y + 11} fill="var(--muted)" fontSize="9" fontWeight="600">
                {val}
              </text>
            </g>
          )
        })}
      </svg>
    )
  }

  return (
    <div className="page-stack">
      <PageHeader title="Reports & Analytics" subtitle="Generate dynamic reporting structures, verify business health metrics, and export data spreadsheets." />

      {/* Primary tab bar */}
      <section className="product-chip-list" style={{ padding: '8px', backgroundColor: 'var(--panel)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '24px' }}>
        {[
          { key: 'sales', label: 'Sales Report' },
          { key: 'inventory', label: 'Inventory Report' },
          { key: 'profit', label: 'Profit Analysis' },
          { key: 'performance', label: 'Product Performance' },
          { key: 'supplier', label: 'Supplier Log' },
          { key: 'customer', label: 'Customer Spend' },
          { key: 'monthly', label: 'Monthly Report' },
          { key: 'daily', label: 'Daily Report' }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className="product-chip"
            onClick={() => setReportType(tab.key)}
            style={{
              padding: '8px 16px',
              backgroundColor: reportType === tab.key ? 'var(--accent)' : 'transparent',
              color: reportType === tab.key ? 'white' : 'var(--muted)',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </section>

      {/* Filters Toolbar */}
      <section className="toolbar-card" style={{ marginBottom: '24px' }}>
        <div className="toolbar-controls" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '4px' }}>From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '4px' }}>To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
              />
            </div>
          </div>

          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </Select>

          <Select
            label="Supplier"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
          >
            <option value="All">All Suppliers</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>

          <Select
            label="Product"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="All">All Products</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>

          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <Button variant="ghost" onClick={handleDownloadCSV}>📥 Export CSV</Button>
            <Button onClick={generatePDF}>📥 Download PDF</Button>
          </div>
        </div>
      </section>

      {/* Summary grid */}
      {reportData && (
        <section className="stats-grid" style={{ marginBottom: '24px' }}>
          {Object.entries(reportData.summary || {}).map(([key, val]) => (
            <Card key={key} title={key} className="stat-card stat-card-info">
              <div className="stat-value">
                {typeof val === 'number' && (key.toLowerCase().includes('revenue') || key.toLowerCase().includes('valuation') || key.toLowerCase().includes('profit') || key.toLowerCase().includes('spend') || key.toLowerCase().includes('value')) ? formatPrice(val) : String(val)}
              </div>
            </Card>
          ))}
        </section>
      )}

      {/* Chart Section */}
      <section className="chart-section" style={{ marginBottom: '24px' }}>
        <Card title="Operational Performance Visualization" subtitle="Filtered analytical values trend graph" className="panel-card chart-card">
          <div style={{ padding: '16px 0', minHeight: '230px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {renderDynamicChart()}
          </div>
        </Card>
      </section>

      {/* Dynamic Data Table */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
          🔄 Recalculating report metrics from database...
        </div>
      ) : (
        <>
          <Table
            columns={getTableColumns()}
            rows={rows}
          />
        </>
      )}
    </div>
  )
}
