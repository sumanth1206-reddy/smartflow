import React, { useEffect, useState } from 'react'
import PageHeader from '../components/common/PageHeader'
import SearchBar from '../components/common/SearchBar'
import Button from '../components/common/Button'
import Table from '../components/common/Table'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/common/Modal'
import Input from '../components/common/Input'
import Loader from '../components/common/Loader'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const setQuery = (val) => setSearchParams({ q: val })
  const [loading, setLoading] = useState(true)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add' or 'edit'
  const [selectedSupplier, setSelectedSupplier] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    history: ''
  })

  async function loadSuppliers() {
    try {
      setLoading(true)
      const response = await api.get('/suppliers')
      setSuppliers(response.data)
    } catch (error) {
      console.error('Failed to load suppliers', error)
      toast.error('Failed to load suppliers.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSuppliers()
  }, [])

  function handleInputChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  function handleOpenAdd() {
    setModalMode('add')
    setSelectedSupplier(null)
    setFormData({
      name: '',
      contactName: '',
      email: '',
      phone: '',
      address: '',
      history: ''
    })
    setIsModalOpen(true)
  }

  function handleOpenEdit(sup) {
    setModalMode('edit')
    setSelectedSupplier(sup)
    setFormData({
      name: sup.name,
      contactName: sup.contactName || '',
      email: sup.email || '',
      phone: sup.phone || '',
      address: sup.address || '',
      history: sup.history || ''
    })
    setIsModalOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Supplier name is required.')
      return
    }

    try {
      setLoading(true)
      if (modalMode === 'add') {
        const response = await api.post('/suppliers', formData)
        setSuppliers((current) => [response.data, ...current])
        toast.success('Supplier added successfully!')
      } else {
        const response = await api.put(`/suppliers/${selectedSupplier.id}`, formData)
        setSuppliers((current) => current.map((item) => item.id === selectedSupplier.id ? response.data : item))
        toast.success('Supplier updated successfully!')
      }
      setIsModalOpen(false)
      setFormData({
        name: '',
        contactName: '',
        email: '',
        phone: '',
        address: '',
        history: ''
      })
    } catch (error) {
      console.error('Failed to save supplier', error)
      const errMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to save supplier.'
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(supId) {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return
    try {
      setLoading(true)
      await api.delete(`/suppliers/${supId}`)
      setSuppliers((current) => current.filter((item) => item.id !== supId))
      toast.success('Supplier deleted successfully!')
    } catch (error) {
      console.error('Failed to delete supplier', error)
      const errMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to delete supplier.'
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  const filteredSuppliers = suppliers.filter((item) => {
    return item.name.toLowerCase().includes(query.toLowerCase()) || 
      (item.contactName && item.contactName.toLowerCase().includes(query.toLowerCase())) ||
      (item.email && item.email.toLowerCase().includes(query.toLowerCase()))
  })



  if (loading && suppliers.length === 0) {
    return <Loader label="Loading suppliers..." />
  }

  return (
    <div className="page-stack">
      <PageHeader title="Suppliers" subtitle="Manage external supply partners, contact info, and transaction records." />

      <section className="toolbar-card">
        <div className="toolbar-controls">
          <SearchBar placeholder="Search suppliers..." value={query} onChange={(event) => { setQuery(event.target.value) }} />
        </div>
        <Button onClick={handleOpenAdd}>+ Add Supplier</Button>
      </section>

      <Modal
        open={isModalOpen}
        title={modalMode === 'add' ? 'Add Supplier' : 'Edit Supplier'}
        onClose={() => setIsModalOpen(false)}
        footer={(
          <div className="inline-actions">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{modalMode === 'add' ? 'Create' : 'Save Changes'}</Button>
          </div>
        )}
      >
        <form className="form-grid form-grid-2" onSubmit={handleSubmit}>
          <Input label="Supplier Name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Global Distributing" required />
          <Input label="Contact Name" name="contactName" value={formData.contactName} onChange={handleInputChange} placeholder="John Doe" />
          <Input label="Email" name="email" value={formData.email} onChange={handleInputChange} placeholder="supplier@example.com" type="email" />
          <Input label="Phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+91 99999 88888" />
          <Input label="Address" name="address" value={formData.address} onChange={handleInputChange} placeholder="Suite 400, Industrial Park" />
          <Input label="History/Notes" name="history" value={formData.history} onChange={handleInputChange} placeholder="Active since 2024" />
        </form>
      </Modal>

      {filteredSuppliers.length === 0 ? (
        <EmptyState title="No suppliers found" description="Create a new supplier profile to track restocking channels." />
      ) : (
        <>
          <Table
            columns={[
              { key: 'name', header: 'Supplier Name', render: (row) => <strong style={{ color: 'var(--accent)', fontWeight: '600' }}>{row.name}</strong> },
              { key: 'contactName', header: 'Contact Person', render: (row) => row.contactName || <span style={{ color: 'var(--muted)' }}>N/A</span> },
              { key: 'email', header: 'Email', render: (row) => row.email || <span style={{ color: 'var(--muted)' }}>N/A</span> },
              { key: 'phone', header: 'Phone', render: (row) => row.phone || <span style={{ color: 'var(--muted)' }}>N/A</span> },
              { key: 'address', header: 'Address', render: (row) => row.address || <span style={{ color: 'var(--muted)' }}>N/A</span> },
              { key: 'actions', header: 'Actions', render: (row) => <div className="action-cell"><button type="button" className="text-btn" onClick={() => handleOpenEdit(row)}>Edit</button><button type="button" className="text-btn" onClick={() => handleDelete(row.id)}>Delete</button></div> }
            ]}
            rows={filteredSuppliers}
          />
        </>
      )}
    </div>
  )
}
