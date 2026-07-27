import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import PageHeader from '../components/common/PageHeader'
import SearchBar from '../components/common/SearchBar'
import Select from '../components/common/Select'
import Card from '../components/common/Card'
import Table from '../components/common/Table'
import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import Loader from '../components/common/Loader'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'

export default function Inventory() {
  const [products, setProducts] = useState([])
  const [inventory, setInventory] = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const setQuery = (val) => setSearchParams({ q: val })
  
  const [status, setStatus] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [supplierFilter, setSupplierFilter] = useState('All')
  const [expiryFilter, setExpiryFilter] = useState('All')
  const [sortBy, setSortBy] = useState('product-asc')
  
  // Modals
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  // Loading state
  const [loading, setLoading] = useState(true)

  // Modal actions states
  const [selectedItem, setSelectedItem] = useState(null)
  const [adjustQty, setAdjustQty] = useState(0)
  const [adjustLocation, setAdjustLocation] = useState('Warehouse A')
  const [adjustReason, setAdjustReason] = useState('Cycle Count')

  async function loadData() {
    try {
      setLoading(true)
      const [prodRes, invRes, catRes, supRes] = await Promise.all([
        api.get('/products'),
        api.get('/inventory'),
        api.get('/categories'),
        api.get('/suppliers')
      ])
      setProducts(prodRes.data)
      setInventory(invRes.data)
      setCategories(catRes.data)
      setSuppliers(supRes.data)
    } catch (error) {
      console.error('Failed to load inventory data', error)
      toast.error('Failed to load inventory data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Auto-polling for real-time updates every 15 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [prodRes, invRes] = await Promise.all([
          api.get('/products'),
          api.get('/inventory')
        ])
        setProducts(prodRes.data)
        setInventory(invRes.data)
      } catch (e) {
        console.error('Polling inventory error', e)
      }
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  const inventoryItems = inventory.map((item) => {
    const product = products.find((p) => p.id === item.productId)
    const currentStock = item.quantity
    let statusVal = 'Healthy'
    if (currentStock === 0) statusVal = 'Critical'
    else if (currentStock < 20) statusVal = 'Low Stock'

    // Expiry Detection
    const expiryDateStr = product?.expiryDate
    let expiryStatus = 'Safe'
    if (expiryDateStr) {
      const now = new Date()
      const expiry = new Date(expiryDateStr)
      const diffTime = expiry - now
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays < 0) {
        expiryStatus = 'Expired'
      } else if (diffDays <= 30) {
        expiryStatus = 'Expiring Soon'
      }
    }

    return {
      id: item.id,
      productId: item.productId,
      product: product ? product.name : 'Unknown Product',
      sku: product ? product.sku : '—',
      barcode: product ? product.barcode : null,
      category: product ? product.category : '—',
      supplierName: product ? product.supplierName : '—',
      currentStock: currentStock,
      minimumStock: product ? (product.quantity < 30 ? 10 : 30) : 30,
      location: item.location || 'Warehouse A',
      status: statusVal,
      expiryDate: expiryDateStr,
      expiryStatus: expiryStatus,
      updated: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'Just now'
    }
  })

  // Statistics
  const totalOnHand = inventory.reduce((sum, item) => sum + item.quantity, 0)
  const reorderNeeded = inventory.filter((item) => item.quantity < 20).length
  const storageLocations = new Set(inventory.map((item) => item.location || 'Warehouse A')).size
  const expiringCount = inventoryItems.filter(item => item.expiryStatus === 'Expired' || item.expiryStatus === 'Expiring Soon').length

  const filteredItems = inventoryItems.filter((item) => {
    const matchesQuery = `${item.product} ${item.sku} ${item.barcode || ''}`.toLowerCase().includes(query.toLowerCase())
    const matchesStatus = status === 'All' || item.status === status
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter
    const matchesSupplier = supplierFilter === 'All' || item.supplierName === supplierFilter
    const matchesExpiry = expiryFilter === 'All' || item.expiryStatus === expiryFilter
    return matchesQuery && matchesStatus && matchesCategory && matchesSupplier && matchesExpiry
  })

  // Apply sorting
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'product-asc') return a.product.localeCompare(b.product)
    if (sortBy === 'product-desc') return b.product.localeCompare(a.product)
    if (sortBy === 'currentStock-asc') return a.currentStock - b.currentStock
    if (sortBy === 'currentStock-desc') return b.currentStock - a.currentStock
    if (sortBy === 'location-asc') return a.location.localeCompare(b.location)
    if (sortBy === 'expiry-asc') {
      if (!a.expiryDate) return 1
      if (!b.expiryDate) return -1
      return new Date(a.expiryDate) - new Date(b.expiryDate)
    }
    return 0
  })



  const restockItems = products
    .filter((p) => p.quantity < 20)
    .sort((a, b) => a.quantity - b.quantity)

  const handleRestockAll = async () => {
    try {
      setLoading(true)
      const promises = restockItems.map((item) => {
        const targetQty = 50
        return api.put(`/products/${item.id}`, { quantity: targetQty })
      })
      await Promise.all(promises)
      toast.success('Restocked critical and low stock items successfully!')
      setIsRestockModalOpen(false)
      await loadData()
    } catch (error) {
      console.error(error)
      toast.error('Failed to restock items.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAdjust = (row) => {
    const rawInvItem = inventory.find(i => i.id === row.id)
    setSelectedItem(rawInvItem)
    setAdjustQty(rawInvItem ? rawInvItem.quantity : 0)
    setAdjustLocation(rawInvItem ? rawInvItem.location || 'Warehouse A' : 'Warehouse A')
    setAdjustReason('Cycle Count')
    setIsAdjustModalOpen(true)
  }

  const handleOpenView = (row) => {
    const rawInvItem = inventory.find(i => i.id === row.id)
    const product = products.find(p => p.id === rawInvItem?.productId)
    setSelectedItem({
      ...row,
      sku: product?.sku,
      category: product?.category,
      price: product?.price,
      costPrice: product?.costPrice
    })
    setIsViewModalOpen(true)
  }

  const handleAdjustSubmit = async (e) => {
    e.preventDefault()
    if (!selectedItem) return
    if (Number(adjustQty) < 0) {
      toast.error('Quantity cannot be negative.')
      return
    }
    try {
      setLoading(true)
      await api.post('/inventory/adjust', {
        productId: selectedItem.productId,
        quantity: parseInt(adjustQty),
        location: adjustLocation,
        reason: adjustReason
      })
      toast.success('Inventory adjusted successfully!')
      setIsAdjustModalOpen(false)
      await loadData()
    } catch (error) {
      console.error('Failed to adjust inventory', error)
      const errMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to adjust inventory.'
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  if (loading && products.length === 0) {
    return <Loader label="Loading inventory dashboard..." />
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Inventory"
        subtitle="Track stock health, minimum levels, and warehouse movement."
        action="Restock Plan"
        onActionClick={() => setIsRestockModalOpen(true)}
      />

      <section className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <Card title="On Hand" subtitle="Live inventory quantity" className="stat-card stat-card-primary">
          <div className="stat-value">{totalOnHand.toLocaleString()}</div>
        </Card>
        <Card title="Reorder Needed" subtitle="Fast-moving SKUs" className="stat-card stat-card-warning">
          <div className="stat-value">{reorderNeeded}</div>
        </Card>
        <Card title="Expiring Soon / Expired" subtitle="Critical date warnings" className="stat-card stat-card-danger">
          <div className="stat-value">{expiringCount}</div>
        </Card>
        <Card title="Storage Locations" subtitle="Active zones" className="stat-card stat-card-info">
          <div className="stat-value">{storageLocations}</div>
        </Card>
      </section>

      <section className="toolbar-card">
        <div className="toolbar-controls" style={{ flexWrap: 'wrap', gap: '8px' }}>
          <SearchBar placeholder="Search name, SKU, barcode..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select label="Category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c.id || c.name} value={c.name}>{c.name}</option>
            ))}
          </Select>
          <Select label="Supplier" value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)}>
            <option value="All">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id || s.name} value={s.name}>{s.name}</option>
            ))}
          </Select>
          <Select label="Stock Status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Healthy">Healthy</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Critical">Critical</option>
          </Select>
          <Select label="Expiry" value={expiryFilter} onChange={(event) => setExpiryFilter(event.target.value)}>
            <option value="All">All Expiries</option>
            <option value="Safe">Safe</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Expired">Expired</option>
          </Select>
          <Select label="Sort By" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="product-asc">Product Name (A-Z)</option>
            <option value="product-desc">Product Name (Z-A)</option>
            <option value="currentStock-asc">Stock (Low to High)</option>
            <option value="currentStock-desc">Stock (High to Low)</option>
            <option value="location-asc">Location (A-Z)</option>
            <option value="expiry-asc">Expiry Date (Soonest First)</option>
          </Select>
        </div>
      </section>

      {sortedItems.length === 0 ? (
        <EmptyState title="No inventory items matched your filters" description="Adjust your filters or search query." />
      ) : (
        <>
          <Table
            columns={[
              { key: 'product', header: 'Product' },
              { key: 'sku', header: 'SKU' },
              { key: 'barcode', header: 'Barcode', render: (row) => row.barcode || '—' },
              { key: 'currentStock', header: 'Current Stock' },
              { key: 'minimumStock', header: 'Minimum Stock' },
              { key: 'location', header: 'Location' },
              { key: 'status', header: 'Stock Status', render: (row) => <Badge variant={row.status === 'Critical' ? 'danger' : row.status === 'Low Stock' ? 'warning' : 'success'}>{row.status}</Badge> },
              { key: 'expiryStatus', header: 'Expiry Status', render: (row) => (
                row.expiryDate ? (
                  <Badge variant={row.expiryStatus === 'Expired' ? 'danger' : row.expiryStatus === 'Expiring Soon' ? 'warning' : 'success'}>
                    {row.expiryStatus === 'Expired' ? 'Expired' : row.expiryStatus === 'Expiring Soon' ? 'Expiring Soon' : 'Safe'}
                  </Badge>
                ) : '—'
              ) },
              { key: 'expiryDate', header: 'Expiry Date', render: (row) => row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : '—' },
              { key: 'actions', header: 'Actions', render: (row) => <div className="action-cell"><button type="button" className="text-btn" onClick={() => handleOpenView(row)}>View</button><button type="button" className="text-btn" onClick={() => handleOpenAdjust(row)}>Adjust</button></div> }
            ]}
            rows={sortedItems}
          />
        </>
      )}

      {/* Suggested Restock Plan Modal */}
      <Modal
        open={isRestockModalOpen}
        title="Suggested Restock Plan"
        onClose={() => setIsRestockModalOpen(false)}
        footer={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setIsRestockModalOpen(false)}>Cancel</Button>
            <Button onClick={handleRestockAll}>Confirm & Restock All</Button>
          </div>
        }
      >
        <p style={{ marginBottom: '16px', color: 'var(--muted)', fontSize: '0.9rem' }}>
          The following products have fallen below the stock threshold. Critical items are sorted at the top.
        </p>

        {restockItems.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)' }}>
            ✓ All products are fully stocked. No restock plan needed.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.3)', paddingBottom: '6px' }}>
                <th style={{ padding: '8px 0', fontSize: '0.9rem', color: 'var(--muted)' }}>Product Name</th>
                <th style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>Current Stock</th>
                <th style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>Status</th>
                <th style={{ fontSize: '0.9rem', color: 'var(--muted)', textAlign: 'right' }}>Restock Target</th>
              </tr>
            </thead>
            <tbody>
              {restockItems.map((item) => {
                const isCritical = item.quantity === 0
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                    <td style={{ padding: '10px 0', fontWeight: '500' }}>{item.name}</td>
                    <td>
                      <span style={{ color: isCritical ? 'var(--danger)' : 'var(--warning)', fontWeight: 'bold' }}>
                        {item.quantity} units
                      </span>
                    </td>
                    <td>
                      <Badge variant={isCritical ? 'danger' : 'warning'}>
                        {isCritical ? 'Critical' : 'Low Stock'}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--accent)' }}>
                      + {50 - item.quantity} units (Target: 50)
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Modal>

      {/* Adjust Inventory Modal */}
      <Modal
        open={isAdjustModalOpen}
        title="Adjust Inventory Stock"
        onClose={() => setIsAdjustModalOpen(false)}
        footer={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setIsAdjustModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAdjustSubmit}>Save Adjustment</Button>
          </div>
        }
      >
        <form onSubmit={handleAdjustSubmit} className="modal-form">
          <div className="form-group">
            <label>Product Name</label>
            <input type="text" className="form-control" value={products.find(p => p.id === selectedItem?.productId)?.name || ''} disabled />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              className="form-control"
              value={adjustLocation}
              onChange={(e) => setAdjustLocation(e.target.value)}
              placeholder="e.g. Warehouse A"
              required
            />
          </div>
          <div className="form-group">
            <label>New Total Stock Quantity</label>
            <input
              type="number"
              className="form-control"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              min="0"
              required
            />
          </div>
          <div className="form-group">
            <label>Reason for Adjustment</label>
            <select
              className="form-control"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              required
            >
              <option value="Cycle Count">Cycle Count</option>
              <option value="Damage">Damage</option>
              <option value="Theft">Theft</option>
              <option value="Receiving Error">Receiving Error</option>
              <option value="Reconciliation">Reconciliation</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal
        open={isViewModalOpen}
        title="Inventory Item Details"
        onClose={() => setIsViewModalOpen(false)}
        footer={
          <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <strong style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Product Name</strong>
            <p style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '4px 0 0' }}>{selectedItem?.product}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <strong style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>SKU</strong>
              <p style={{ margin: '4px 0 0', fontWeight: '500' }}>{selectedItem?.sku || 'N/A'}</p>
            </div>
            <div>
              <strong style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Category</strong>
              <p style={{ margin: '4px 0 0', fontWeight: '500' }}>{selectedItem?.category || 'N/A'}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <strong style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Current Stock</strong>
              <p style={{ margin: '4px 0 0', fontWeight: 'bold' }}>{selectedItem?.currentStock} units</p>
            </div>
            <div>
              <strong style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Minimum Stock</strong>
              <p style={{ margin: '4px 0 0', fontWeight: '500' }}>{selectedItem?.minimumStock} units</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <strong style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Storage Zone</strong>
              <p style={{ margin: '4px 0 0', fontWeight: '500' }}>{selectedItem?.location}</p>
            </div>
            <div>
              <strong style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Stock Status</strong>
              <div style={{ marginTop: '4px' }}>
                <Badge variant={selectedItem?.status === 'Critical' ? 'danger' : selectedItem?.status === 'Low Stock' ? 'warning' : 'success'}>
                  {selectedItem?.status}
                </Badge>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <strong style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Barcode</strong>
              <p style={{ margin: '4px 0 0', fontWeight: '500' }}>{selectedItem?.barcode || 'N/A'}</p>
            </div>
            <div>
              <strong style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Expiry Date</strong>
              <p style={{ margin: '4px 0 0', fontWeight: '500' }}>{selectedItem?.expiryDate ? new Date(selectedItem.expiryDate).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
          <div>
            <strong style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Supplier</strong>
            <p style={{ margin: '4px 0 0', fontWeight: '500' }}>{selectedItem?.supplierName || 'N/A'}</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
