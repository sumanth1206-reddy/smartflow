import React, { useEffect, useState } from 'react'
import PageHeader from '../components/common/PageHeader'
import SearchBar from '../components/common/SearchBar'
import Select from '../components/common/Select'
import Button from '../components/common/Button'
import Table from '../components/common/Table'
import Badge from '../components/common/Badge'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/common/Modal'
import Input from '../components/common/Input'
import Loader from '../components/common/Loader'
import { formatPrice } from '../utils/currency'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const setQuery = (val) => setSearchParams({ q: val })
  
  const [category, setCategory] = useState('All')
  const [supplierFilter, setSupplierFilter] = useState('All')
  const [status, setStatus] = useState('All')
  const [sortBy, setSortBy] = useState('name-asc')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [detailMode, setDetailMode] = useState('view')
  const [loading, setLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    price: '',
    costPrice: '',
    quantity: '',
    status: 'In Stock',
    image: '📦',
    barcode: '',
    expiryDate: '',
    supplierId: ''
  })

  function getStatusFromQuantity(quantity) {
    const stock = Number(quantity) || 0
    if (stock === 0) return 'Out of Stock'
    if (stock < 10) return 'Low Stock'
    return 'In Stock'
  }

  function handleInputChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const uploadData = new FormData()
    uploadData.append('image', file)
    try {
      setUploadingImage(true)
      const res = await api.post('/products/upload-image', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      setFormData(prev => ({ ...prev, image: res.data.imageUrl }))
      toast.success('Image uploaded successfully!')
    } catch (err) {
      console.error(err)
      toast.error('Image upload failed.')
    } finally {
      setUploadingImage(false)
    }
  }

  async function loadData() {
    try {
      setLoading(true)
      const [prodRes, catRes, supRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
        api.get('/suppliers')
      ])
      setProducts(prodRes.data)
      setCategories(catRes.data)
      setSuppliers(supRes.data)
      
      const defaultCat = catRes.data[0]?.name || ''
      setFormData(prev => ({ ...prev, category: defaultCat }))
    } catch (error) {
      console.error('Failed to load products, categories, or suppliers', error)
      toast.error('Unable to load initial data.')
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
        const prodRes = await api.get('/products')
        setProducts(prodRes.data)
      } catch (e) {
        console.error('Polling error', e)
      }
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  function validateFormData(id = null) {
    if (!formData.name.trim()) {
      toast.error('Product Name is required.')
      return false
    }
    if (!formData.sku.trim()) {
      toast.error('SKU is required.')
      return false
    }
    if (formData.price === '' || isNaN(formData.price)) {
      toast.error('Selling Price must be a valid number.')
      return false
    }
    if (Number(formData.price) < 0) {
      toast.error('Selling Price cannot be negative.')
      return false
    }
    if (formData.costPrice && Number(formData.costPrice) < 0) {
      toast.error('Cost Price cannot be negative.')
      return false
    }
    if (formData.quantity && Number(formData.quantity) < 0) {
      toast.error('Quantity cannot be negative.')
      return false
    }

    // Name duplicate check
    const nameLower = formData.name.trim().toLowerCase()
    const duplicate = products.find(p => p.name.trim().toLowerCase() === nameLower && p.id !== id)
    if (duplicate) {
      toast.error(`Product name "${formData.name}" already exists.`)
      return false
    }

    // Barcode duplicate check
    if (formData.barcode.trim()) {
      const barcodeLower = formData.barcode.trim().toLowerCase()
      const duplicateBc = products.find(p => p.barcode && p.barcode.trim().toLowerCase() === barcodeLower && p.id !== id)
      if (duplicateBc) {
        toast.error(`Barcode "${formData.barcode}" is already assigned to another product.`)
        return false
      }
    }

    return true
  }

  async function handleAddProduct(event) {
    event.preventDefault()
    if (!validateFormData()) return

    try {
      setLoading(true)
      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        category: formData.category,
        price: Number(formData.price),
        costPrice: formData.costPrice ? Number(formData.costPrice) : null,
        quantity: Number(formData.quantity) || 0,
        status: getStatusFromQuantity(formData.quantity),
        image: formData.image,
        barcode: formData.barcode.trim() || null,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null,
        supplierId: formData.supplierId ? Number(formData.supplierId) : null
      }

      const response = await api.post('/products', payload)
      const newProduct = response.data
      setProducts((current) => [newProduct, ...current])
      toast.success('Product added successfully!')
      setIsModalOpen(false)
      
      setFormData({
        name: '',
        sku: '',
        category: categories[0]?.name || '',
        price: '',
        costPrice: '',
        quantity: '',
        status: 'In Stock',
        image: '📦',
        barcode: '',
        expiryDate: '',
        supplierId: ''
      })
    } catch (error) {
      console.error('Failed to add product', error)
      const errMsg = error.response?.data?.error || 'Failed to add product.'
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  function openProductDetails(product, mode = 'view') {
    setSelectedProduct(product)
    setDetailMode(mode)
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category || categories[0]?.name || '',
      price: String(product.price),
      costPrice: product.costPrice ? String(product.costPrice) : '',
      quantity: String(product.quantity),
      status: product.status,
      image: product.image || '📦',
      barcode: product.barcode || '',
      expiryDate: product.expiryDate ? product.expiryDate.split('T')[0] : '',
      supplierId: product.supplierId ? String(product.supplierId) : ''
    })
    setIsDetailOpen(true)
  }

  async function deleteProduct(productId) {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    try {
      setLoading(true)
      await api.delete(`/products/${productId}`)
      setProducts((current) => current.filter((item) => item.id !== productId))
      toast.success('Product removed successfully!')
    } catch (error) {
      console.error('Failed to delete product', error)
      toast.error('Failed to delete product.')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateProduct(event) {
    event.preventDefault()
    if (!selectedProduct) return
    if (!validateFormData(selectedProduct.id)) return

    try {
      setLoading(true)
      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        category: formData.category,
        price: Number(formData.price),
        costPrice: formData.costPrice ? Number(formData.costPrice) : null,
        quantity: Number(formData.quantity) || 0,
        status: getStatusFromQuantity(formData.quantity),
        image: formData.image,
        barcode: formData.barcode.trim() || null,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null,
        supplierId: formData.supplierId ? Number(formData.supplierId) : null
      }

      const response = await api.put(`/products/${selectedProduct.id}`, payload)
      const updatedProduct = response.data
      setProducts((current) => current.map((item) => item.id === selectedProduct.id ? updatedProduct : item))
      toast.success('Product updated successfully.')
      setIsDetailOpen(false)
      setSelectedProduct(null)
    } catch (error) {
      console.error('Failed to update product', error)
      const errMsg = error.response?.data?.error || 'Failed to update product.'
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter((item) => {
    const matchesQuery = `${item.name} ${item.sku} ${item.barcode || ''}`.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = category === 'All' || item.category === category
    const matchesSupplier = supplierFilter === 'All' || item.supplierName === supplierFilter
    const matchesStatus = status === 'All' || item.status === status
    return matchesQuery && matchesCategory && matchesSupplier && matchesStatus
  })

  // Apply sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name)
    if (sortBy === 'name-desc') return b.name.localeCompare(a.name)
    if (sortBy === 'quantity-asc') return a.quantity - b.quantity
    if (sortBy === 'quantity-desc') return b.quantity - a.quantity
    if (sortBy === 'price-asc') return Number(a.price) - Number(b.price)
    if (sortBy === 'price-desc') return Number(b.price) - Number(a.price)
    if (sortBy === 'expiry-asc') {
      if (!a.expiryDate) return 1
      if (!b.expiryDate) return -1
      return new Date(a.expiryDate) - new Date(b.expiryDate)
    }
    if (sortBy === 'expiry-desc') {
      if (!a.expiryDate) return 1
      if (!b.expiryDate) return -1
      return new Date(b.expiryDate) - new Date(a.expiryDate)
    }
    return 0
  })



  if (loading && products.length === 0) {
    return <Loader label="Loading products..." />
  }

  return (
    <div className="page-stack">
      <PageHeader title="Products" subtitle="Manage SKUs, availability, and catalog health." />

      <section className="toolbar-card">
        <div className="toolbar-controls" style={{ flexWrap: 'wrap', gap: '8px' }}>
          <SearchBar placeholder="Search name, SKU, or barcode..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select label="Category" value={category} onChange={(event) => setCategory(event.target.value)}>
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
          <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="All">All Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </Select>
          <Select label="Sort By" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="quantity-asc">Quantity (Low to High)</option>
            <option value="quantity-desc">Quantity (High to Low)</option>
            <option value="price-asc">Price (Low to High)</option>
            <option value="price-desc">Price (High to Low)</option>
            <option value="expiry-asc">Expiry (Soonest First)</option>
            <option value="expiry-desc">Expiry (Furthest First)</option>
          </Select>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>+ Add Product</Button>
      </section>

      <Modal
        open={isModalOpen}
        title="Add Product"
        onClose={() => setIsModalOpen(false)}
        footer={(
          <div className="inline-actions">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddProduct}>Save Product</Button>
          </div>
        )}
      >
        <form className="form-grid form-grid-3" onSubmit={handleAddProduct}>
          <Input label="Product Name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter product name" />
          <Input label="SKU" name="sku" value={formData.sku} onChange={handleInputChange} placeholder="SKU-001" />
          <Select label="Category" name="category" value={formData.category} onChange={handleInputChange}>
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id || c.name} value={c.name}>{c.name}</option>
            ))}
          </Select>
          <Input label="Selling Price" name="price" type="number" step="0.01" value={formData.price} onChange={handleInputChange} placeholder="99.99" />
          <Input label="Cost Price" name="costPrice" type="number" step="0.01" value={formData.costPrice} onChange={handleInputChange} placeholder="70.00" />
          <Input label="Quantity" name="quantity" type="number" value={formData.quantity} onChange={handleInputChange} placeholder="25" />
          <Input label="Barcode" name="barcode" value={formData.barcode} onChange={handleInputChange} placeholder="e.g. 8901234567890" />
          <Input label="Expiry Date" name="expiryDate" type="date" value={formData.expiryDate} onChange={handleInputChange} />
          <Select label="Supplier" name="supplierId" value={formData.supplierId} onChange={handleInputChange}>
            <option value="">Select Supplier</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>

          <div style={{ gridColumn: 'span 3', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
            <label className="input-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Product Image</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {formData.image && formData.image.startsWith('/api') ? (
                <img src={formData.image} alt="Preview" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)' }} />
              ) : (
                <span style={{ fontSize: '2.2rem' }}>{formData.image || '📦'}</span>
              )}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} id="image-upload" />
                <label htmlFor="image-upload" className="btn btn-ghost" style={{ cursor: 'pointer', padding: '6px 14px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.9rem', backgroundColor: 'var(--surface)' }}>
                  {uploadingImage ? 'Uploading...' : 'Upload File'}
                </label>
                {formData.image && formData.image !== '📦' && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setFormData(prev => ({ ...prev, image: '📦' }))}
                    style={{ padding: '6px 14px', border: '1px solid var(--danger)', borderRadius: '4px', fontSize: '0.9rem', color: 'var(--danger)', backgroundColor: 'transparent', cursor: 'pointer' }}
                  >
                    Remove Image
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={isDetailOpen}
        title={detailMode === 'edit' ? 'Edit Product' : 'Product Details'}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedProduct(null)
        }}
        footer={detailMode === 'edit' ? (
          <div className="inline-actions">
            <Button variant="ghost" onClick={() => {
              setIsDetailOpen(false)
              setSelectedProduct(null)
            }}>Cancel</Button>
            <Button onClick={handleUpdateProduct}>Save Changes</Button>
          </div>
        ) : (
          <div className="inline-actions">
            <Button variant="ghost" onClick={() => {
              setIsDetailOpen(false)
              setSelectedProduct(null)
            }}>Close</Button>
            <Button onClick={() => setDetailMode('edit')}>Edit Product</Button>
          </div>
        )}
      >
        {selectedProduct ? (
          detailMode === 'edit' ? (
            <form className="form-grid form-grid-3" onSubmit={handleUpdateProduct}>
              <Input label="Product Name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter product name" />
              <Input label="SKU" name="sku" value={formData.sku} onChange={handleInputChange} placeholder="SKU-001" />
              <Select label="Category" name="category" value={formData.category} onChange={handleInputChange}>
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id || c.name} value={c.name}>{c.name}</option>
                ))}
              </Select>
              <Input label="Selling Price" name="price" type="number" step="0.01" value={formData.price} onChange={handleInputChange} placeholder="99.99" />
              <Input label="Cost Price" name="costPrice" type="number" step="0.01" value={formData.costPrice} onChange={handleInputChange} placeholder="70.00" />
              <Input label="Quantity" name="quantity" type="number" value={formData.quantity} onChange={handleInputChange} placeholder="25" />
              <Input label="Barcode" name="barcode" value={formData.barcode} onChange={handleInputChange} placeholder="e.g. 8901234567890" />
              <Input label="Expiry Date" name="expiryDate" type="date" value={formData.expiryDate} onChange={handleInputChange} />
              <Select label="Supplier" name="supplierId" value={formData.supplierId} onChange={handleInputChange}>
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>

              <div style={{ gridColumn: 'span 3', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
                <label className="input-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Product Image</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {formData.image && formData.image.startsWith('/api') ? (
                    <img src={formData.image} alt="Preview" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)' }} />
                  ) : (
                    <span style={{ fontSize: '2.2rem' }}>{formData.image || '📦'}</span>
                  )}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} id="image-upload-edit" />
                    <label htmlFor="image-upload-edit" className="btn btn-ghost" style={{ cursor: 'pointer', padding: '6px 14px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.9rem', backgroundColor: 'var(--surface)' }}>
                      {uploadingImage ? 'Uploading...' : 'Upload File'}
                    </label>
                    {formData.image && formData.image !== '📦' && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setFormData(prev => ({ ...prev, image: '📦' }))}
                        style={{ padding: '6px 14px', border: '1px solid var(--danger)', borderRadius: '4px', fontSize: '0.9rem', color: 'var(--danger)', backgroundColor: 'transparent', cursor: 'pointer' }}
                      >
                        Remove Image
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="detail-panel">
              <div className="profile-card">
                <div className="profile-avatar" style={{ overflow: 'hidden' }}>
                  {selectedProduct.image && selectedProduct.image.startsWith('/api') ? (
                    <img src={selectedProduct.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    selectedProduct.image || '📦'
                  )}
                </div>
                <div>
                  <h3>{selectedProduct.name}</h3>
                  <p>{selectedProduct.sku}</p>
                  <p>{selectedProduct.category || 'No Category'}</p>
                </div>
              </div>
              <div className="info-list">
                <div><span>Price</span><strong>{formatPrice(selectedProduct.price)}</strong></div>
                <div><span>Cost Price</span><strong>{selectedProduct.costPrice ? formatPrice(selectedProduct.costPrice) : 'N/A'}</strong></div>
                <div><span>Quantity</span><strong>{selectedProduct.quantity}</strong></div>
                <div><span>Status</span><strong>{selectedProduct.status}</strong></div>
                <div><span>Barcode</span><strong>{selectedProduct.barcode || 'N/A'}</strong></div>
                <div><span>Expiry Date</span><strong>{selectedProduct.expiryDate ? new Date(selectedProduct.expiryDate).toLocaleDateString() : 'N/A'}</strong></div>
                <div><span>Supplier</span><strong>{selectedProduct.supplierName || 'N/A'}</strong></div>
              </div>
            </div>
          )
        ) : null}
      </Modal>

      {sortedProducts.length === 0 ? (
        <EmptyState title="No products matched your filters" description="Adjust your search or try another category." />
      ) : (
        <>
          <Table
            columns={[
              { key: 'image', header: 'Image', render: (row) => (
                <div className="product-emoji" style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: '4px' }}>
                  {row.image && row.image.startsWith('/api') ? (
                    <img src={row.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    row.image || '📦'
                  )}
                </div>
              ) },
              { key: 'name', header: 'Product Name' },
              { key: 'sku', header: 'SKU' },
              { key: 'barcode', header: 'Barcode', render: (row) => row.barcode || '—' },
              { key: 'category', header: 'Category' },
              { key: 'price', header: 'Price', render: (row) => formatPrice(row.price) },
              { key: 'expiryDate', header: 'Expiry Date', render: (row) => row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : '—' },
              { key: 'status', header: 'Status', render: (row) => {
                const derivedStatus = getStatusFromQuantity(row.quantity)
                return <Badge variant={derivedStatus === 'Out of Stock' ? 'danger' : derivedStatus === 'Low Stock' ? 'warning' : 'success'}>{derivedStatus}</Badge>
              } },
              { key: 'actions', header: 'Actions', render: (row) => (
                <div className="action-cell">
                  <button type="button" className="text-btn" onClick={() => openProductDetails(row, 'edit')}>Edit</button>
                  <button type="button" className="text-btn" onClick={() => openProductDetails(row, 'view')}>View</button>
                  <button type="button" className="text-btn" onClick={() => deleteProduct(row.id)}>Delete</button>
                </div>
              ) }
            ]}
            rows={sortedProducts}
          />
        </>
      )}
    </div>
  )
}
