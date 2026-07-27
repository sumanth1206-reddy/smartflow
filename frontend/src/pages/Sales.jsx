import React, { useEffect, useState } from 'react'
import PageHeader from '../components/common/PageHeader'
import SearchBar from '../components/common/SearchBar'
import Select from '../components/common/Select'
import Card from '../components/common/Card'
import Table from '../components/common/Table'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import { formatPrice, getPdfSafePrice } from '../utils/currency'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function Sales() {
  const [sales, setSales] = useState([])
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const setQuery = (val) => setSearchParams({ q: val })
  const [status, setStatus] = useState('All')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedSale, setSelectedSale] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Edit State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editCustomer, setEditCustomer] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editStatus, setEditStatus] = useState('Paid')
  const [editPaymentMethod, setEditPaymentMethod] = useState('Cash')

  async function loadSales() {
    try {
      const response = await api.get('/sales')
      setSales(response.data)
    } catch (error) {
      console.error('Failed to load sales history', error)
      toast.error('Failed to load sales history')
    }
  }

  useEffect(() => {
    loadSales()
  }, [])

  const filteredSales = sales.filter((sale) => {
    const matchesQuery =
      sale.id.toLowerCase().includes(query.toLowerCase()) ||
      sale.customer.toLowerCase().includes(query.toLowerCase())
    const matchesStatus = status === 'All' || sale.status === status
    
    let matchesDate = true
    if (sale.date) {
      const saleDateOnly = sale.date.split(' ')[0] // Extract YYYY-MM-DD
      if (startDate && saleDateOnly < startDate) matchesDate = false
      if (endDate && saleDateOnly > endDate) matchesDate = false
    }

    return matchesQuery && matchesStatus && matchesDate
  })



  // Analytics Metrics
  const totalSalesCount = filteredSales.length
  const totalRevenue = filteredSales.reduce((acc, s) => acc + Number(String(s.total).replace(/[$\u20AC\u00A3\u20B9\u00A5,]/g, '')), 0)
  const totalTax = filteredSales.reduce((acc, s) => acc + Number(String(s.tax || 0).replace(/[$\u20AC\u00A3\u20B9\u00A5,]/g, '')), 0)
  const totalDiscount = filteredSales.reduce((acc, s) => acc + Number(String(s.discount || 0).replace(/[$\u20AC\u00A3\u20B9\u00A5,]/g, '')), 0)

  function openSaleDetails(sale) {
    setSelectedSale(sale)
    setIsDetailOpen(true)
  }

  function openEditSale(sale) {
    setSelectedSale(sale)
    setEditCustomer(sale.customer)
    setEditEmail(sale.email || '')
    setEditStatus(sale.status)
    setEditPaymentMethod(sale.paymentMethod || 'Cash')
    setIsEditOpen(true)
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    try {
      const response = await api.put(`/sales/${selectedSale.id}`, {
        customer: editCustomer,
        email: editEmail,
        status: editStatus,
        paymentMethod: editPaymentMethod
      })
      toast.success('Sale record updated successfully!')
      setSales(sales.map(s => s.id === selectedSale.id ? response.data : s))
      setIsEditOpen(false)
    } catch (err) {
      console.error(err)
      toast.error('Failed to update sale record.')
    }
  }

  async function handleDeleteSale(saleId) {
    if (!window.confirm('Are you sure you want to cancel and delete this sale? This will automatically restore all items back to stock.')) {
      return
    }
    try {
      await api.delete(`/sales/${saleId}`)
      toast.success('Sale successfully cancelled and stock restored!')
      setSales(sales.filter(s => s.id !== saleId))
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete sale.')
    }
  }

  async function downloadInvoicePDF(sale) {
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      
      // Top header banner
      doc.setFillColor(37, 99, 235) // #2563eb
      doc.rect(0, 0, 210, 40, 'F')
      
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text('SmartFlow Invoice', 14, 25)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(239, 246, 255)
      doc.text(`Invoice ID: ${sale.id} | Date: ${sale.date}`, 14, 32)
      
      let y = 55
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(15, 23, 42)
      doc.text('Customer Information', 14, y)
      
      y += 8
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(51, 65, 85)
      doc.text(`Customer Name: ${sale.customer || 'Walk-in Customer'}`, 14, y)
      y += 6
      doc.text(`Payment Method: ${sale.paymentMethod || 'Cash'}`, 14, y)
      y += 6
      doc.text(`Email Address: ${sale.email || 'N/A'}`, 14, y)
      
      y += 12
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(15, 23, 42)
      doc.text('Items Summary', 14, y)
      
      y += 8
      doc.setFillColor(241, 245, 249)
      doc.rect(14, y, 182, 8, 'F')
      
      doc.setFontSize(9)
      doc.setTextColor(51, 65, 85)
      doc.text('Item Name', 16, y + 6)
      doc.text('Unit Price', 90, y + 6)
      doc.text('Qty', 140, y + 6)
      doc.text('Amount', 170, y + 6)
      
      y += 8
      doc.setFont('helvetica', 'normal')
      sale.items.forEach((item, idx) => {
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252)
          doc.rect(14, y, 182, 8, 'F')
        }
        doc.setTextColor(15, 23, 42)
        doc.text(item.item, 16, y + 6)
        doc.text(getPdfSafePrice(item.price), 90, y + 6)
        doc.text(String(item.qty), 140, y + 6)
        doc.text(getPdfSafePrice(item.amount), 170, y + 6)
        y += 8
      })
      
      y += 8
      doc.setFillColor(248, 250, 252)
      doc.rect(120, y, 76, 32, 'F')
      doc.setDrawColor(226, 232, 240)
      doc.rect(120, y, 76, 32)
      
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text('Subtotal:', 124, y + 6)
      doc.text(getPdfSafePrice(sale.subtotal || 0), 164, y + 6)
      
      doc.text('GST (8%):', 124, y + 12)
      doc.text(getPdfSafePrice(sale.tax || 0), 164, y + 12)
      
      doc.text('Discount:', 124, y + 18)
      doc.text(`-${getPdfSafePrice(sale.discount || 0)}`, 164, y + 18)
      
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(15, 23, 42)
      doc.text('Grand Total:', 124, y + 26)
      doc.text(getPdfSafePrice(sale.total), 164, y + 26)
      
      y += 40
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(148, 163, 184)
      doc.text('Thank you for shopping with SmartFlow Operations. For support, contact admin@smartflow.com.', 14, y)
      
      doc.save(`Invoice_${sale.id}.pdf`)
      toast.success('Invoice PDF downloaded successfully!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate invoice PDF')
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Sales History"
        subtitle="Review historical sales records, customer details, and invoice transactions."
      />

      {/* Revenue Analytics Cards */}
      <section className="stats-grid" style={{ marginBottom: '24px' }}>
        <Card title="Total Transactions" className="stat-card stat-card-primary">
          <div className="stat-value">{totalSalesCount}</div>
          <div className="stat-detail">Completed transactions</div>
        </Card>
        <Card title="Total Revenue" className="stat-card stat-card-success">
          <div className="stat-value">{formatPrice(totalRevenue)}</div>
          <div className="stat-detail">Gross sales turnover</div>
        </Card>
        <Card title="GST Collected" className="stat-card stat-card-info">
          <div className="stat-value">{formatPrice(totalTax)}</div>
          <div className="stat-detail">Total tax collected (8%)</div>
        </Card>
        <Card title="Discounts Offered" className="stat-card stat-card-warning">
          <div className="stat-value">{formatPrice(totalDiscount)}</div>
          <div className="stat-detail">Rewards & deductions</div>
        </Card>
      </section>

      {/* Toolbar controls */}
      <section className="toolbar-card">
        <div className="toolbar-controls" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <SearchBar
            placeholder="Search by invoice ID or customer"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
            }}
          />
          <Select
            label="Status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
            }}
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </Select>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '4px' }}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value) }}
                style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '4px' }}>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value) }}
                style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
              />
            </div>
          </div>
        </div>
      </section>

      <Table
        columns={[
          { key: 'id', header: 'Invoice ID' },
          { key: 'date', header: 'Date' },
          { key: 'customer', header: 'Customer' },
          {
            key: 'items',
            header: 'Items Sold',
            render: (row) => {
              if (!row.items || row.items.length === 0) return 'No items'
              const names = row.items.map((i) => `${i.item} (x${i.qty})`).join(', ')
              return names.length > 40 ? names.substring(0, 37) + '...' : names
            }
          },
          { key: 'total', header: 'Grand Total', render: (row) => formatPrice(row.total) },
          {
            key: 'status',
            header: 'Status',
            render: (row) => (
              <Badge variant={row.status === 'Paid' ? 'success' : 'warning'}>
                {row.status}
              </Badge>
            )
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (row) => (
              <div className="action-cell" style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => openSaleDetails(row)}
                >
                  View Details
                </button>
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => openEditSale(row)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-btn"
                  style={{ color: 'var(--danger)' }}
                  onClick={() => handleDeleteSale(row.id)}
                >
                  Delete
                </button>
              </div>
            )
          }
        ]}
        rows={filteredSales}
      />

      {/* Details Modal */}
      <Modal
        open={isDetailOpen}
        title={`Invoice Details - ${selectedSale?.id}`}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedSale(null)
        }}
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            <Button
              variant="primary"
              onClick={() => downloadInvoicePDF(selectedSale)}
            >
              📥 Download PDF
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setIsDetailOpen(false)
                setSelectedSale(null)
              }}
            >
              Close
            </Button>
          </div>
        }
      >
        {selectedSale && (
          <div className="modal-form-layout">
            <div className="detail-section">
              <h4 style={{ marginBottom: '8px' }}>Customer Information</h4>
              <p><strong>Name:</strong> {selectedSale.customer}</p>
              <p><strong>Email:</strong> {selectedSale.email || 'N/A'}</p>
              <p><strong>Date:</strong> {selectedSale.date}</p>
              <p><strong>Payment Method:</strong> {selectedSale.paymentMethod || 'Cash'}</p>
              <p><strong>Status:</strong> <Badge variant={selectedSale.status === 'Paid' ? 'success' : 'warning'}>{selectedSale.status}</Badge></p>
            </div>
            
            <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid rgba(148, 163, 184, 0.2)' }} />
            
            <div className="detail-section">
              <h4 style={{ marginBottom: '12px' }}>Items Summary</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.3)', paddingBottom: '6px' }}>
                    <th style={{ padding: '6px 0' }}>Item Name</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                      <td style={{ padding: '8px 0' }}>{item.item}</td>
                      <td>{formatPrice(item.price)}</td>
                      <td>{item.qty}</td>
                      <td>{formatPrice(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', marginTop: '16px' }}>
                <div><span>Subtotal: </span><strong>{formatPrice(selectedSale.subtotal || 0)}</strong></div>
                <div><span>GST (8%): </span><strong>{formatPrice(selectedSale.tax || 0)}</strong></div>
                <div><span>Discount: </span><strong>-{formatPrice(selectedSale.discount || 0)}</strong></div>
                <div style={{ fontSize: '1.1rem', marginTop: '6px' }}><strong>Grand Total: {formatPrice(selectedSale.total)}</strong></div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={isEditOpen}
        title={`Edit Invoice - ${selectedSale?.id}`}
        onClose={() => {
          setIsEditOpen(false)
          setSelectedSale(null)
        }}
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveEdit}>Save Changes</Button>
          </div>
        }
      >
        {selectedSale && (
          <form onSubmit={handleSaveEdit} className="modal-form-layout" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Customer Name"
              value={editCustomer}
              onChange={(e) => setEditCustomer(e.target.value)}
              required
            />
            <Input
              label="Customer Email"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
            />
            <Select
              label="Payment Method"
              value={editPaymentMethod}
              onChange={(e) => setEditPaymentMethod(e.target.value)}
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="UPI">UPI</option>
            </Select>
            <Select
              label="Payment Status"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
            >
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </Select>
          </form>
        )}
      </Modal>
    </div>
  )
}
