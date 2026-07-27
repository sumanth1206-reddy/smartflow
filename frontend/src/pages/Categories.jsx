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

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const setQuery = (val) => setSearchParams({ q: val })
  const [loading, setLoading] = useState(true)
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add' or 'edit'
  const [selectedCategory, setSelectedCategory] = useState(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  async function loadCategories() {
    try {
      setLoading(true)
      const response = await api.get('/categories')
      setCategories(response.data)
    } catch (error) {
      console.error('Failed to load categories', error)
      toast.error('Failed to load categories.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  function handleInputChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  function handleOpenAdd() {
    setModalMode('add')
    setSelectedCategory(null)
    setFormData({ name: '', description: '' })
    setIsModalOpen(true)
  }

  function handleOpenEdit(cat) {
    setModalMode('edit')
    setSelectedCategory(cat)
    setFormData({
      name: cat.name,
      description: cat.description || ''
    })
    setIsModalOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Category name is required.')
      return
    }

    try {
      setLoading(true)
      if (modalMode === 'add') {
        const response = await api.post('/categories', formData)
        setCategories((current) => [response.data, ...current])
        toast.success('Category created successfully!')
      } else {
        const response = await api.put(`/categories/${selectedCategory.id}`, formData)
        setCategories((current) => current.map((item) => item.id === selectedCategory.id ? response.data : item))
        toast.success('Category updated successfully!')
      }
      setIsModalOpen(false)
      setFormData({ name: '', description: '' })
    } catch (error) {
      console.error('Failed to save category', error)
      const errMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to save category.'
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(catId) {
    if (!window.confirm('Are you sure you want to delete this category? All associated products may need to be updated.')) return
    try {
      setLoading(true)
      await api.delete(`/categories/${catId}`)
      setCategories((current) => current.filter((item) => item.id !== catId))
      toast.success('Category deleted successfully!')
    } catch (error) {
      console.error('Failed to delete category', error)
      const errMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to delete category.'
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter((item) => {
    return item.name.toLowerCase().includes(query.toLowerCase()) || 
      (item.description && item.description.toLowerCase().includes(query.toLowerCase()))
  })



  if (loading && categories.length === 0) {
    return <Loader label="Loading categories..." />
  }

  return (
    <div className="page-stack">
      <PageHeader title="Categories" subtitle="Organize inventory items into logical groupings for reporting and alert thresholds." />

      <section className="toolbar-card">
        <div className="toolbar-controls">
          <SearchBar placeholder="Search categories..." value={query} onChange={(event) => { setQuery(event.target.value) }} />
        </div>
        <Button onClick={handleOpenAdd}>+ Add Category</Button>
      </section>

      <Modal
        open={isModalOpen}
        title={modalMode === 'add' ? 'Add Category' : 'Edit Category'}
        onClose={() => setIsModalOpen(false)}
        footer={(
          <div className="inline-actions">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{modalMode === 'add' ? 'Create' : 'Save Changes'}</Button>
          </div>
        )}
      >
        <form className="form-grid form-grid-1" onSubmit={handleSubmit}>
          <Input label="Category Name" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Health, Electronics" required />
          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-control"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Provide a brief description of the products included in this category"
              rows={4}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>
        </form>
      </Modal>

      {filteredCategories.length === 0 ? (
        <EmptyState title="No categories found" description="Create a new category to get started." />
      ) : (
        <>
          <Table
            columns={[
              { key: 'name', header: 'Category Name', render: (row) => <strong style={{ color: 'var(--accent)', fontWeight: '600' }}>{row.name}</strong> },
              { key: 'description', header: 'Description', render: (row) => row.description || <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>No description</span> },
              { key: 'productCount', header: 'Products Listed', render: (row) => <span>{row.productCount || 0} items</span> },
              { key: 'actions', header: 'Actions', render: (row) => <div className="action-cell"><button type="button" className="text-btn" onClick={() => handleOpenEdit(row)}>Edit</button><button type="button" className="text-btn" onClick={() => handleDelete(row.id)}>Delete</button></div> }
            ]}
            rows={filteredCategories}
          />
        </>
      )}
    </div>
  )
}
