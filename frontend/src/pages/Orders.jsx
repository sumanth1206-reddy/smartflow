import React, { useEffect, useState } from 'react'
import PageHeader from '../components/common/PageHeader'
import SearchBar from '../components/common/SearchBar'
import Button from '../components/common/Button'
import Table from '../components/common/Table'
import Badge from '../components/common/Badge'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/common/Modal'
import Select from '../components/common/Select'
import Input from '../components/common/Input'
import Loader from '../components/common/Loader'
import { formatPrice } from '../utils/currency'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const setQuery = (val) => setSearchParams({ q: val })
  const [loading, setLoading] = useState(true)

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Create PO Form States
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [orderItems, setOrderItems] = useState([]) // array of { productId, name, qty, price }
  
  // Single Item Add States
  const [itemProductId, setItemProductId] = useState('')
  const [itemQty, setItemQty] = useState(1)
  const [itemPrice, setItemPrice] = useState('')

  async function loadData() {
    try {
      setLoading(true)
      const [ordRes, supRes, prodRes] = await Promise.all([
        api.get('/orders'),
        api.get('/suppliers'),
        api.get('/products')
      ])
      setOrders(ordRes.data)
      setSuppliers(supRes.data)
      setProducts(prodRes.data)
      
      if (supRes.data.length > 0) setSelectedSupplierId(String(supRes.data[0].id))
      if (prodRes.data.length > 0) {
        setItemProductId(String(prodRes.data[0].id))
        setItemPrice(String(prodRes.data[0].costPrice || prodRes.data[0].price || 0))
      }
    } catch (error) {
      console.error('Failed to load purchase orders data', error)
      toast.error('Failed to load purchase orders.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Product Selection handler
  const handleProductSelectChange = (e) => {
    const pid = e.target.value
    setItemProductId(pid)
    const product = products.find(p => String(p.id) === pid)
    if (product) {
      // Remove any currency symbol
      const cleanCost = String(product.costPrice || product.price || 0).replace(/[$\u20AC\u00A3\u20B9\u00A5]/g, '')
      setItemPrice(cleanCost)
    }
  }

  // Add Item to local order list
  const handleAddItem = (e) => {
    e.preventDefault()
    if (!itemProductId) return
    const product = products.find(p => String(p.id) === itemProductId)
    if (!product) return

    // Check if already in list
    if (orderItems.some(item => item.productId === product.id)) {
      toast.error('Product already added to the list. Adjust quantity inside the list.')
      return
    }

    const priceNum = parseFloat(itemPrice)
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Please enter a valid price.')
      return
    }

    const qtyNum = parseInt(itemQty)
    if (isNaN(qtyNum) || qtyNum <= 0) {
      toast.error('Please enter a valid quantity.')
      return
    }

    setOrderItems(prev => [...prev, {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      qty: qtyNum,
      price: priceNum
    }])

    toast.success(`${product.name} added to purchase list.`)
  }

  // Remove Item from local order list
  const handleRemoveItem = (productId) => {
    setOrderItems(prev => prev.filter(item => item.productId !== productId))
  }

  // Submit new PO
  const handleCreateOrder = async (e) => {
    e.preventDefault()
    if (!selectedSupplierId) {
      toast.error('Please select a supplier.')
      return
    }
    if (orderItems.length === 0) {
      toast.error('Please add at least one item to the purchase order.')
      return
    }

    try {
      setLoading(true)
      const payload = {
        supplierId: Number(selectedSupplierId),
        status: 'Pending',
        items: orderItems.map(item => ({
          productId: Number(item.productId),
          qty: Number(item.qty),
          price: Number(item.price)
        }))
      }

      await api.post('/orders', payload)
      toast.success('Purchase Order created successfully!')
      setIsCreateModalOpen(false)
      setOrderItems([])
      await loadData()
    } catch (error) {
      console.error('Failed to create purchase order', error)
      const errMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to create order.'
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  // Transition PO status
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setLoading(true)
      await api.put(`/orders/${orderId}/status`, { status: newStatus })
      toast.success(`Order status updated to ${newStatus}`)
      if (newStatus === 'Received') {
        toast.success('Stock levels successfully updated!')
      }
      await loadData()
    } catch (error) {
      console.error('Failed to update status', error)
      const errMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to update status.'
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenView = (row) => {
    setSelectedOrder(row)
    setIsDetailModalOpen(true)
  }

  const filteredOrders = orders.filter((o) => {
    return o.supplierName?.toLowerCase().includes(query.toLowerCase()) || 
           String(o.id).includes(query)
  })



  const poTotalSum = orderItems.reduce((sum, item) => sum + (item.qty * item.price), 0)

  if (loading && orders.length === 0) {
    return <Loader label="Loading purchase orders..." />
  }

  return (
    <div className="page-stack">
      <PageHeader title="Purchase Orders" subtitle="Create restock purchase orders and track receipt and updates." />

      <section className="toolbar-card">
        <div className="toolbar-controls">
          <SearchBar placeholder="Search by supplier or order ID..." value={query} onChange={(event) => { setQuery(event.target.value) }} />
        </div>
        <Button onClick={() => {
          setIsCreateModalOpen(true)
          setOrderItems([])
          if (suppliers.length > 0) setSelectedSupplierId(String(suppliers[0].id))
        }}>+ Create Order</Button>
      </section>

      {/* Detail Modal */}
      <Modal
        open={isDetailModalOpen}
        title={`Purchase Order #${selectedOrder?.id}`}
        onClose={() => setIsDetailModalOpen(false)}
        footer={<Button onClick={() => setIsDetailModalOpen(false)}>Close</Button>}
      >
        {selectedOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <strong style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Supplier</strong>
                <p style={{ margin: '4px 0 0', fontWeight: 'bold' }}>{selectedOrder.supplierName}</p>
              </div>
              <div>
                <strong style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Date Created</strong>
                <p style={{ margin: '4px 0 0' }}>{new Date(selectedOrder.orderDate).toLocaleString()}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <strong style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Total Cost</strong>
                <p style={{ margin: '4px 0 0', fontWeight: 'bold', color: 'var(--accent)' }}>{formatPrice(selectedOrder.totalAmount)}</p>
              </div>
              <div>
                <strong style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Status</strong>
                <div style={{ marginTop: '4px' }}>
                  <Badge variant={selectedOrder.status === 'Received' ? 'success' : selectedOrder.status === 'Cancelled' ? 'danger' : selectedOrder.status === 'Ordered' ? 'info' : 'warning'}>
                    {selectedOrder.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <strong style={{ color: 'var(--muted)', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>Line Items</strong>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.3)', paddingBottom: '6px' }}>
                    <th style={{ padding: '6px 0', fontSize: '0.85rem', color: 'var(--muted)' }}>Product</th>
                    <th style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>SKU</th>
                    <th style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Quantity</th>
                    <th style={{ fontSize: '0.85rem', color: 'var(--muted)', textAlign: 'right' }}>Unit Cost</th>
                    <th style={{ fontSize: '0.85rem', color: 'var(--muted)', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                      <td style={{ padding: '8px 0', fontWeight: '500' }}>{item.productName || `Product #${item.productId}`}</td>
                      <td>{item.sku || 'N/A'}</td>
                      <td>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>{formatPrice(item.price)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatPrice(item.quantity * item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Order Modal */}
      <Modal
        open={isCreateModalOpen}
        title="Create Purchase Order"
        onClose={() => setIsCreateModalOpen(false)}
        footer={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateOrder} disabled={orderItems.length === 0}>Submit Purchase Order</Button>
          </div>
        }
      >
        <form onSubmit={handleCreateOrder} className="modal-form">
          <div className="form-group">
            <label>Select Restocking Supplier</label>
            <Select value={selectedSupplierId} onChange={(e) => setSelectedSupplierId(e.target.value)}>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.contactName || 'No Contact'})</option>
              ))}
            </Select>
          </div>

          <fieldset style={{ border: '1px solid rgba(148, 163, 184, 0.2)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <legend style={{ padding: '0 8px', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--accent)' }}>Add Restocking Item</legend>
            <div className="form-grid form-grid-3">
              <Select label="Product" value={itemProductId} onChange={handleProductSelectChange}>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Qty: {p.quantity})</option>
                ))}
              </Select>
              <Input label="Cost Price Unit" type="number" step="0.01" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} required />
              <Input label="Order Quantity" type="number" min="1" value={itemQty} onChange={(e) => setItemQty(e.target.value)} required />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <Button type="button" variant="ghost" onClick={handleAddItem}>+ Add to Item List</Button>
            </div>
          </fieldset>

          <div>
            <strong style={{ color: 'var(--muted)', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>Purchase Order Item List</strong>
            {orderItems.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--muted)', border: '1px dashed var(--border)', borderRadius: '6px' }}>
                No items added yet.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.3)' }}>
                    <th style={{ padding: '6px 0', fontSize: '0.85rem' }}>Product</th>
                    <th style={{ fontSize: '0.85rem' }}>Qty</th>
                    <th style={{ fontSize: '0.85rem', textAlign: 'right' }}>Price</th>
                    <th style={{ fontSize: '0.85rem', textAlign: 'right' }}>Total</th>
                    <th style={{ fontSize: '0.85rem', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item) => (
                    <tr key={item.productId} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                      <td style={{ padding: '8px 0', fontWeight: '500' }}>{item.name}</td>
                      <td>{item.qty}</td>
                      <td style={{ textAlign: 'right' }}>{formatPrice(item.price)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatPrice(item.qty * item.price)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button type="button" style={{ color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => handleRemoveItem(item.productId)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan="3" style={{ padding: '12px 0 6px', fontWeight: 'bold', fontSize: '0.95rem' }}>Total Cost:</td>
                    <td style={{ padding: '12px 0 6px', fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--accent)', textAlign: 'right' }}>
                      {formatPrice(poTotalSum)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </form>
      </Modal>

      {filteredOrders.length === 0 ? (
        <EmptyState title="No Purchase Orders found" description="Create a new purchase order to stock inventory from suppliers." />
      ) : (
        <>
          <Table
            columns={[
              { key: 'id', header: 'PO ID', render: (row) => <strong>#{row.id}</strong> },
              { key: 'supplierName', header: 'Supplier' },
              { key: 'orderDate', header: 'Date Created', render: (row) => new Date(row.orderDate).toLocaleDateString() },
              { key: 'totalAmount', header: 'Total Cost', render: (row) => <strong style={{ color: 'var(--accent)' }}>{formatPrice(row.totalAmount)}</strong> },
              { key: 'status', header: 'Status', render: (row) => (
                <Badge variant={row.status === 'Received' ? 'success' : row.status === 'Cancelled' ? 'danger' : row.status === 'Ordered' ? 'info' : 'warning'}>
                  {row.status}
                </Badge>
              ) },
              { key: 'actions', header: 'Actions', render: (row) => (
                <div className="action-cell">
                  <button type="button" className="text-btn" onClick={() => handleOpenView(row)}>View</button>
                  {row.status === 'Pending' && (
                    <button type="button" className="text-btn" onClick={() => handleUpdateStatus(row.id, 'Ordered')}>Order</button>
                  )}
                  {row.status === 'Ordered' && (
                    <button type="button" className="text-btn" onClick={() => handleUpdateStatus(row.id, 'Received')}>Receive</button>
                  )}
                  {['Pending', 'Ordered'].includes(row.status) && (
                    <button type="button" className="text-btn" style={{ color: 'var(--danger)' }} onClick={() => handleUpdateStatus(row.id, 'Cancelled')}>Cancel</button>
                  )}
                </div>
              ) }
            ]}
            rows={filteredOrders}
          />
        </>
      )}
    </div>
  )
}
