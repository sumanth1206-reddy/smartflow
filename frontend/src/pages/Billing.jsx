import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { jsPDF } from 'jspdf'
import PageHeader from '../components/common/PageHeader'
import Card from '../components/common/Card'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import Table from '../components/common/Table'
import Modal from '../components/common/Modal'
import Select from '../components/common/Select'
import { formatPrice, getPdfSafePrice } from '../utils/currency'
import api from '../services/api'

export default function Billing() {
  const [products, setProducts] = useState([])
  const [invoiceItems, setInvoiceItems] = useState([])

  // Customer State
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')

  // Billing Settings
  const [paymentStatus, setPaymentStatus] = useState('Paid')
  const [customDiscount, setCustomDiscount] = useState('0')

  // Invoice History State
  const [recentInvoices, setRecentInvoices] = useState([])

  // Modal & Print State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [printedSale, setPrintedSale] = useState(null)

  // Custom Warnings & Delivery State
  const [warningMessage, setWarningMessage] = useState('')
  const [isWarningOpen, setIsWarningOpen] = useState(false)
  const [deliveryMethod, setDeliveryMethod] = useState('Print')
  const [sentEmailAddress, setSentEmailAddress] = useState('')
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Cash')
  const [amountTendered, setAmountTendered] = useState('')
  const [upiAmount, setUpiAmount] = useState('')
  const [settings, setSettings] = useState(null)

  // Terminal Authorization State
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [empId, setEmpId] = useState('')
  const [loginError, setLoginError] = useState('')

  function handleTerminalLogin(e) {
    e.preventDefault()
    if (['EMP101', 'reddysumanth1206@gmail.com'].includes(empId)) {
      setIsAuthorized(true)
      setLoginError('')
      toast.success('Cashier signed in successfully!')
    } else {
      setLoginError('Invalid Employee ID.')
      toast.error('Authentication failed!')
    }
  }

  function showWarning(msg) {
    setWarningMessage(msg)
    setIsWarningOpen(true)
  }

  async function loadData() {
    try {
      const [prodRes, settingsRes, salesRes] = await Promise.all([
        api.get('/products'),
        api.get('/settings'),
        api.get('/sales')
      ])
      setProducts(prodRes.data)
      setSettings(settingsRes.data)
      setRecentInvoices(salesRes.data.slice(0, 5))
    } catch (error) {
      console.error('Failed to load data for billing page', error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function addItem(product) {
    if (product.quantity <= 0) {
      showWarning('Product is out of stock!')
      return
    }

    setInvoiceItems((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) {
        const nextQty = existing.qty + 1
        if (nextQty > product.quantity) {
          showWarning(`Only ${product.quantity} units of ${product.name} are available in stock.`)
          return current
        }
        return current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                qty: nextQty,
                amount: formatPrice((Number(item.price.replace(/[$\u20AC\u00A3\u20B9\u00A5]/g, '')) * nextQty).toFixed(2))
              }
            : item
        )
      }

      return [
        ...current,
        {
          id: product.id,
          item: product.name,
          qty: 1,
          price: product.price,
          amount: product.price
        }
      ]
    })
  }

  function removeItem(id) {
    setInvoiceItems((current) => current.filter((item) => item.id !== id))
  }

  const totals = useMemo(() => {
    const subtotal = invoiceItems.reduce((sum, item) => sum + Number(item.price.replace(/[$\u20AC\u00A3\u20B9\u00A5]/g, '')) * item.qty, 0)
    const taxRate = settings?.taxRate ? Number(settings.taxRate) : 8.00
    const gst = subtotal * (taxRate / 100)

    let discount = 0
    const cleanDisc = customDiscount.trim()
    if (cleanDisc) {
      if (cleanDisc.endsWith('%')) {
        const pct = parseFloat(cleanDisc.slice(0, -1)) || 0
        discount = subtotal * (pct / 100)
      } else {
        discount = parseFloat(cleanDisc) || 0
      }
    }

    const grandTotal = Math.max(0, subtotal + gst - discount)

    return {
      subtotal,
      gst,
      discount,
      grandTotal
    }
  }, [invoiceItems, customDiscount, settings])

  function handleBuyNow() {
    if (invoiceItems.length === 0) {
      showWarning('Please add at least one item to the invoice before checkout.')
      return
    }
    setAmountTendered('')
    setUpiAmount('')
    setSelectedPaymentMethod('Cash')
    setIsPaymentModalOpen(true)
  }

  async function processPayment() {
    try {
      const response = await api.post('/sales', {
        customer: customerName || 'Walk-in Customer',
        items: invoiceItems,
        total: formatPrice(totals.grandTotal.toFixed(2)),
        subtotal: formatPrice(totals.subtotal.toFixed(2)),
        tax: formatPrice(totals.gst.toFixed(2)),
        discount: formatPrice(totals.discount.toFixed(2)),
        status: paymentStatus,
        paymentMethod: selectedPaymentMethod,
        email: customerEmail || null,
        phone: customerPhone || null,
        address: customerAddress || null
      })

      const sale = response.data
      setDeliveryMethod('Print')
      setPrintedSale(sale)
      setIsPaymentModalOpen(false)
      setIsPrintModalOpen(true)
    } catch (error) {
      console.error('Error saving sale', error)
      showWarning('Failed to register sale to backend.')
    }
  }

  function handleSendInvoice() {
    if (invoiceItems.length === 0) {
      showWarning('Please add at least one item to the invoice before sending.')
      return
    }

    setEmailInput(customerEmail || '')
    setIsEmailModalOpen(true)
  }

  async function submitEmailInvoice() {
    if (!emailInput || !emailInput.includes('@')) {
      showWarning('Please enter a valid email address.')
      return
    }

    setIsEmailModalOpen(false)

    if (printedSale) {
      toast.success(`Invoice ${printedSale.id} successfully emailed to ${emailInput}!`)
      // Open Gmail compose with existing details
      const subject = `Invoice ${printedSale.id} from SmartFlow Operations`
      let body = `Hello ${customerName || 'Customer'},\n\n`
      body += `Thank you for your business. Here is the invoice breakdown for your recent order:\n\n`
      body += `Order Invoice ID: ${printedSale.id}\n`
      body += `Date: ${printedSale.date}\n`
      body += `Customer Name: ${customerName || 'Walk-in Customer'}\n`
      body += `Mobile Number: ${customerPhone || 'N/A'}\n\n`
      body += `Invoice Details:\n`
      body += `==================================================\n`

      printedSale.items.forEach((item) => {
        body += `${item.item} x ${item.qty} units | Price: ${formatPrice(item.price)} | Amount: ${formatPrice(item.amount)}\n`
      })

      body += `==================================================\n`
      body += `Grand Total: ${formatPrice(printedSale.total)}\n\n`
      body += `Best regards,\n`
      body += `SmartFlow Operations Team`

      const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailInput)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      window.open(gmailComposeUrl, '_blank')

      setDeliveryMethod('Email')
      setSentEmailAddress(emailInput)
      return
    }

    try {
      const response = await api.post('/sales', {
        customer: customerName || 'Walk-in Customer',
        items: invoiceItems,
        total: formatPrice(totals.grandTotal.toFixed(2)),
        subtotal: formatPrice(totals.subtotal.toFixed(2)),
        tax: formatPrice(totals.gst.toFixed(2)),
        discount: formatPrice(totals.discount.toFixed(2)),
        status: paymentStatus,
        email: emailInput,
        phone: customerPhone || null,
        address: customerAddress || null,
        paymentMethod: 'UPI'
      })

      const sale = response.data
      setDeliveryMethod('Email')
      setSentEmailAddress(emailInput)
      setPrintedSale(sale)
      setIsPrintModalOpen(true)
      toast.success(`Invoice ${sale.id} successfully emailed to ${emailInput}!`)

      const subject = `Invoice ${sale.id} from SmartFlow Operations`
      let body = `Hello ${customerName || 'Customer'},\n\n`
      body += `Thank you for your business. Here is the invoice breakdown for your recent order:\n\n`
      body += `Order Invoice ID: ${sale.id}\n`
      body += `Date: ${sale.date}\n`
      body += `Customer Name: ${customerName || 'Walk-in Customer'}\n`
      body += `Mobile Number: ${customerPhone || 'N/A'}\n\n`
      body += `Invoice Details:\n`
      body += `==================================================\n`

      invoiceItems.forEach((item) => {
        body += `${item.item} x ${item.qty} units | Price: ${formatPrice(item.price)} | Amount: ${formatPrice(item.amount)}\n`
      })

      body += `==================================================\n`
      body += `Subtotal: ${formatPrice(totals.subtotal.toFixed(2))}\n`
      body += `GST: ${formatPrice(totals.gst.toFixed(2))}\n`
      body += `Discount Applied: -${formatPrice(totals.discount.toFixed(2))}\n`
      body += `Grand Total: ${formatPrice(totals.grandTotal.toFixed(2))}\n\n`
      body += `Best regards,\n`
      body += `SmartFlow Operations Team`

      const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailInput)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      window.open(gmailComposeUrl, '_blank')
    } catch (error) {
      console.error('Error sending invoice email', error)
      showWarning('Failed to register and email invoice.')
    }
  }

  const handlePrintReceipt = (sale) => {
    if (!sale) return
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${sale.id}</title>
          <style>
            body { font-family: monospace; padding: 20px; color: #000; }
            .header { text-align: center; margin-bottom: 20px; }
            .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; padding: 4px 0; }
            .right { text-align: right; }
            .total { font-weight: bold; font-size: 1.1rem; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${settings?.orgName || 'SmartFlow Operations'}</h2>
            <p>${settings?.email || 'billing@smartflow.com'}</p>
            <p>Invoice ID: ${sale.id}</p>
            <p>Date: ${sale.date}</p>
          </div>
          <div class="divider"></div>
          <p><strong>Customer:</strong> ${sale.customer}</p>
          ${sale.email ? `<p><strong>Email:</strong> ${sale.email}</p>` : ''}
          ${sale.phone ? `<p><strong>Phone:</strong> ${sale.phone}</p>` : ''}
          ${sale.address ? `<p><strong>Address:</strong> ${sale.address}</p>` : ''}
          <div class="divider"></div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th class="right">Amt</th>
              </tr>
            </thead>
            <tbody>
              ${sale.items.map(item => `
                <tr>
                  <td>${item.item}</td>
                  <td>${item.qty}</td>
                  <td class="right">${formatPrice(item.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="divider"></div>
          <div class="right">
            <p>Subtotal: ${formatPrice(sale.subtotal)}</p>
            <p>GST: ${formatPrice(sale.tax)}</p>
            <p>Discount: -${formatPrice(sale.discount)}</p>
            <p class="total">Grand Total: ${formatPrice(sale.total)}</p>
          </div>
          <div class="divider"></div>
          <p style="text-align: center; font-size: 0.9rem;">Thank you for your business!</p>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleDownloadPDF = (sale) => {
    if (!sale) return
    const doc = new jsPDF()

    // Header Banner
    doc.setFillColor(37, 99, 235)
    doc.rect(0, 0, 210, 35, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(settings?.orgName || 'SmartFlow Operations', 14, 22)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(220, 230, 245)
    doc.text(`Invoice ID: ${sale.id} | Date: ${sale.date}`, 14, 30)

    // Customer Info
    doc.setTextColor(50, 50, 50)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Customer Details:', 14, 48)

    doc.setFont('helvetica', 'normal')
    doc.text(`Name: ${sale.customer}`, 14, 55)
    if (sale.phone) doc.text(`Phone: ${sale.phone}`, 14, 61)
    if (sale.email) doc.text(`Email: ${sale.email}`, 14, 67)
    if (sale.address) doc.text(`Address: ${sale.address}`, 14, 73)

    // Draw separator line
    doc.setDrawColor(220, 220, 220)
    doc.line(14, 78, 196, 78)

    // Items table header
    doc.setFont('helvetica', 'bold')
    doc.text('Item Name', 16, 85)
    doc.text('Qty', 100, 85)
    doc.text('Price', 130, 85)
    doc.text('Amount', 170, 85)
    doc.line(14, 88, 196, 88)

    let y = 95
    doc.setFont('helvetica', 'normal')
    sale.items.forEach(item => {
      doc.text(String(item.item || 'Unknown Item'), 16, y)
      doc.text(String(item.qty), 100, y)
      doc.text(getPdfSafePrice(item.price), 130, y)
      doc.text(getPdfSafePrice(item.amount), 170, y)
      y += 8
    })

    doc.line(14, y, 196, y)
    y += 10

    // Totals
    doc.setFont('helvetica', 'bold')
    doc.text('Subtotal:', 130, y)
    doc.text(getPdfSafePrice(sale.subtotal), 170, y)

    y += 6
    doc.text('GST:', 130, y)
    doc.text(getPdfSafePrice(sale.tax), 170, y)

    y += 6
    doc.text('Discount:', 130, y)
    doc.text(`-${getPdfSafePrice(sale.discount)}`, 170, y)

    y += 8
    doc.setFontSize(12)
    doc.text('Grand Total:', 130, y)
    doc.text(getPdfSafePrice(sale.total), 170, y)

    doc.save(`Receipt_${sale.id}.pdf`)
    toast.success('Invoice PDF downloaded successfully!')
  }

  function handleCloseModal() {
    setIsPrintModalOpen(false)
    setPrintedSale(null)
    setInvoiceItems([])
    setCustomerName('')
    setCustomerEmail('')
    setCustomerPhone('')
    setCustomerAddress('')
    setCustomDiscount('0')
    setPaymentStatus('Paid')
    setEmailInput('')
    setUpiAmount('')
    loadData()
  }

  if (!isAuthorized) {
    return (
      <div className="page-stack" style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <Card title="🔐 POS Terminal Sign-In" subtitle="Enter your cashier details to unlock this register.">
            <form onSubmit={handleTerminalLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              {loginError && (
                <div style={{ color: 'var(--danger)', fontSize: '0.9rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  ⚠️ {loginError}
                </div>
              )}

              <Input
                label="Employee ID"
                placeholder="e.g. EMP101"
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                required
              />

              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '-4px', backgroundColor: 'var(--panel)', padding: '8px 12px', borderRadius: '6px', border: '1px dashed var(--border)' }}>
                <strong>🔑 Quick Access IDs:</strong>
                <div style={{ marginTop: '4px' }}>Employee ID: <code>EMP101</code> or <code>reddysumanth1206@gmail.com</code></div>
              </div>

              <Button type="submit" style={{ padding: '12px', fontSize: '1rem', marginTop: '8px' }}>
                Unlock Register
              </Button>
            </form>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <PageHeader title="Billing" subtitle="Create polished customer invoices and send them out quickly." />

      <Card title="Product Selection" subtitle="Choose items for this invoice" className="panel-card">
        <div className="product-chip-list">
          {products.map((product) => (
            <button key={product.id} type="button" className="product-chip" onClick={() => addItem(product)}>
              {product.name} ({product.quantity})
            </button>
          ))}
        </div>
      </Card>

      <Card title="Invoice Items" subtitle="Draft order breakdown" className="panel-card">
        <Table
          columns={[
            { key: 'item', header: 'Item' },
            { key: 'qty', header: 'Qty' },
            { key: 'price', header: 'Price', render: (row) => formatPrice(row.price) },
            { key: 'amount', header: 'Amount', render: (row) => formatPrice(row.amount) },
            {
              key: 'actions',
              header: 'Action',
              render: (row) => (
                <button type="button" className="text-btn" onClick={() => removeItem(row.id)}>
                  Delete
                </button>
              )
            }
          ]}
          rows={invoiceItems}
        />
      </Card>

      <section className="billing-grid">
        <Card title="Customer Information" subtitle="Primary contact details" className="panel-card">
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input label="Customer Name" placeholder="Walk-in Customer" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            <Input label="Mobile Number" placeholder="(555) 010-2299" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            <Input label="Email Address" placeholder="customer@example.com" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
            <Select label="Payment Status" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </Select>
            <div style={{ gridColumn: 'span 2' }}>
              <Input label="Billing Address" placeholder="123 Smart St, City" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} />
            </div>
          </div>
        </Card>

        <Card title="Invoice Summary" subtitle="Estimated totals" className="panel-card">
          <div className="summary-list">
            <div><span>Subtotal</span><strong>{formatPrice(totals.subtotal.toFixed(2))}</strong></div>
            <div>
              <span>GST ({settings?.taxRate ? `${settings.taxRate}%` : '8%'})</span>
              <strong>{formatPrice(totals.gst.toFixed(2))}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Discount (Amount or %)</span>
              <input
                type="text"
                value={customDiscount}
                onChange={(e) => setCustomDiscount(e.target.value)}
                style={{
                  width: '80px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border)',
                  textAlign: 'right',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  background: 'var(--surface)',
                  color: 'var(--foreground)'
                }}
              />
            </div>
            <div><span>Discount Value</span><strong>{formatPrice(totals.discount.toFixed(2))}</strong></div>
            <div className="summary-total"><span>Grand Total</span><strong>{formatPrice(totals.grandTotal.toFixed(2))}</strong></div>
          </div>
          <div className="inline-actions" style={{ marginTop: '16px' }}>
            <Button onClick={handleBuyNow} style={{ width: '100%' }}>Buy Now</Button>
          </div>
        </Card>
      </section>

      {/* Invoice History Widget */}
      <Card title="Recent Invoice History" subtitle="Last 5 completed transactions in this session" className="panel-card" style={{ marginTop: '24px' }}>
        <Table
          columns={[
            { key: 'id', header: 'Invoice ID' },
            { key: 'date', header: 'Date' },
            { key: 'customer', header: 'Customer' },
            { key: 'paymentMethod', header: 'Method' },
            { key: 'status', header: 'Status', render: (r) => <span style={{ color: r.status === 'Paid' ? 'var(--success)' : 'var(--warning)', fontWeight: 'bold' }}>{r.status}</span> },
            { key: 'total', header: 'Total', render: (r) => formatPrice(r.total) },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="text-btn" onClick={() => handlePrintReceipt(row)}>🖨️ Print</button>
                  <button type="button" className="text-btn" onClick={() => handleDownloadPDF(row)}>📄 PDF</button>
                </div>
              )
            }
          ]}
          rows={recentInvoices}
        />
      </Card>

      <Modal
        open={isPrintModalOpen}
        title={deliveryMethod === 'Email' ? 'Invoice Emailed & Sold' : 'Invoice Printed & Sold'}
        onClose={handleCloseModal}
        footer={(
          <div className="inline-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={handleCloseModal}>Done</Button>
            {printedSale && (
              <>
                <Button variant="ghost" onClick={handleSendInvoice}>📧 Send Invoice</Button>
                <Button variant="ghost" onClick={() => handlePrintReceipt(printedSale)}>🖨️ Print Receipt</Button>
                <Button onClick={() => handleDownloadPDF(printedSale)}>📄 Download PDF</Button>
              </>
            )}
          </div>
        )}
      >
        {printedSale && (
          <div className="modal-form-layout" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: deliveryMethod === 'Email' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)', padding: '12px', borderRadius: '8px', color: deliveryMethod === 'Email' ? '#2563eb' : '#16a34a', fontWeight: '500', textAlign: 'center' }}>
              {deliveryMethod === 'Email'
                ? `Invoice successfully emailed to ${sentEmailAddress}! Stock quantities updated.`
                : 'Transaction registered successfully! Stock quantities have been updated.'}
            </div>
            <div>
              <h4 style={{ marginBottom: '8px' }}>Invoice Info</h4>
              <p><strong>Order ID:</strong> {printedSale.id}</p>
              <p><strong>Date:</strong> {printedSale.date}</p>
              <p><strong>Customer:</strong> {printedSale.customer}</p>
              <p><strong>Payment Method:</strong> {printedSale.paymentMethod || 'Cash'}</p>
              <p><strong>Payment Status:</strong> {printedSale.status}</p>
            </div>
            <div>
              <h4 style={{ marginBottom: '8px' }}>Sold Items</h4>
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
                  {printedSale.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                      <td style={{ padding: '8px 0' }}>{item.item}</td>
                      <td>{formatPrice(item.price)}</td>
                      <td>{item.qty}</td>
                      <td>{formatPrice(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: '8px' }}>
              <div>Subtotal: {formatPrice(printedSale.subtotal)}</div>
              <div>GST: {formatPrice(printedSale.tax)}</div>
              <div>Discount: -{formatPrice(printedSale.discount)}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: '4px' }}>Grand Total: {formatPrice(printedSale.total)}</div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={isWarningOpen}
        title="Attention"
        onClose={() => setIsWarningOpen(false)}
        footer={
          <Button onClick={() => setIsWarningOpen(false)}>OK</Button>
        }
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <p style={{ margin: 0, fontWeight: '500', color: 'var(--foreground)' }}>{warningMessage}</p>
        </div>
      </Modal>

      <Modal
        open={isEmailModalOpen}
        title="Send Invoice via Email"
        onClose={() => setIsEmailModalOpen(false)}
        footer={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setIsEmailModalOpen(false)}>Cancel</Button>
            <Button onClick={submitEmailInvoice}>Send</Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px 0' }}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
            Please enter the customer's email address to send the invoice.
          </p>
          <Input
            label="Email Address"
            placeholder="customer@example.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
          />
        </div>
      </Modal>

      {/* Payment Options Modal */}
      <Modal
        open={isPaymentModalOpen}
        title="Complete Payment"
        onClose={() => setIsPaymentModalOpen(false)}
        footer={null}
      >
        <div style={{ display: 'flex', gap: '24px', minHeight: '300px', flexDirection: 'row', flexWrap: 'wrap' }}>
          {/* Left Panel - Summary */}
          <div style={{ flex: '1 1 250px', backgroundColor: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--muted)', fontSize: '1.1rem' }}>Order Summary</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--foreground)' }}>Items</span>
              <strong>{invoiceItems.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ color: 'var(--foreground)' }}>Subtotal</span>
              <strong>{formatPrice(totals.subtotal.toFixed(2))}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ color: 'var(--foreground)' }}>GST ({settings?.taxRate ? `${settings.taxRate}%` : '8%'})</span>
              <strong>{formatPrice(totals.gst.toFixed(2))}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ color: 'var(--foreground)' }}>Discount</span>
              <strong>-{formatPrice(totals.discount.toFixed(2))}</strong>
            </div>
            <div style={{ flexGrow: 1 }} />
            <hr style={{ border: 'none', borderTop: '1px dashed var(--border)', margin: '16px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>To Pay</span>
              <strong style={{ fontSize: '1.8rem', color: 'var(--accent)' }}>{formatPrice(totals.grandTotal.toFixed(2))}</strong>
            </div>
          </div>

          {/* Right Panel - Payment Methods */}
          <div style={{ flex: '2 1 350px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['Cash', 'Card', 'UPI'].map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setSelectedPaymentMethod(method)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: selectedPaymentMethod === method ? '2px solid var(--accent)' : '1px solid var(--border)',
                    backgroundColor: selectedPaymentMethod === method ? 'var(--accent-light)' : 'transparent',
                    color: selectedPaymentMethod === method ? 'var(--accent)' : 'var(--foreground)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedPaymentMethod === method ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none'
                  }}
                >
                  {method === 'Cash' && '💵 '}
                  {method === 'Card' && '💳 '}
                  {method === 'UPI' && '📱 '}
                  {method}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, backgroundColor: 'var(--bg)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: '1px solid var(--border)' }}>
              {selectedPaymentMethod === 'Cash' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <Input
                    label="Amount Tendered"
                    type="number"
                    value={amountTendered}
                    onChange={e => setAmountTendered(e.target.value)}
                    placeholder="e.g. 1000"
                    autoFocus
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>Change Due:</span>
                    <strong style={{ fontSize: '1.2rem', color: (amountTendered && Number(amountTendered) >= totals.grandTotal) ? 'var(--success)' : 'var(--danger)' }}>
                      {amountTendered ? formatPrice((Math.max(0, Number(amountTendered) - totals.grandTotal)).toFixed(2)) : '₹0.00'}
                    </strong>
                  </div>
                </div>
              )}
              {selectedPaymentMethod === 'Card' && (
                <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 0' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '16px', animation: 'pulse 2s infinite' }}>💳</div>
                  <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>Waiting for customer to tap or insert card...</p>
                </div>
              )}
              {selectedPaymentMethod === 'UPI' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px 0' }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      `upi://pay?pa=sumanthbujji010206-1@oksbi&pn=${encodeURIComponent('Bayannagari Sumanth Reddy')}&am=${totals.grandTotal.toFixed(2)}&cu=INR`
                    )}`}
                    alt="Dynamic UPI QR Code"
                    style={{ width: '180px', height: '180px', borderRadius: '12px', border: '2px solid #e2e8f0', objectFit: 'contain', backgroundColor: 'white', padding: '8px' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                    Scan to pay <strong>₹{totals.grandTotal.toFixed(2)}</strong>
                  </span>
                </div>
              )}
            </div>

            <Button
              onClick={processPayment}
              disabled={selectedPaymentMethod === 'Cash' && amountTendered !== '' && Number(amountTendered) < totals.grandTotal}
              style={{ padding: '16px', fontSize: '1.1rem', fontWeight: '600', height: 'auto', marginTop: '8px' }}
            >
              Complete Payment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
