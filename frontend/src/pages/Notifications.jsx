import React, { useEffect, useState } from 'react'
import PageHeader from '../components/common/PageHeader'
import SearchBar from '../components/common/SearchBar'
import Button from '../components/common/Button'
import Table from '../components/common/Table'
import Badge from '../components/common/Badge'
import EmptyState from '../components/common/EmptyState'
import Loader from '../components/common/Loader'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const setQuery = (val) => setSearchParams({ q: val })
  const [loading, setLoading] = useState(true)

  async function loadNotifications() {
    try {
      setLoading(true)
      const response = await api.get('/notifications')
      setNotifications(response.data)
    } catch (error) {
      console.error('Failed to load notifications', error)
      toast.error('Failed to load notifications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  function getIcon(type) {
    if (type?.toUpperCase() === 'WARNING') return '⚠';
    if (type?.toUpperCase() === 'SALE' || type?.toUpperCase() === 'INVOICE') return '🧾';
    if (type?.toUpperCase() === 'INVENTORY') return '📦';
    if (type?.toUpperCase() === 'AI') return '🤖';
    return '🔔';
  }

  const handleMarkRead = async (id) => {
    try {
      setLoading(true)
      await api.put(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      toast.success('Notification marked as read')
    } catch (err) {
      console.error('Failed to mark notification as read', err)
      toast.error('Failed to update notification.')
    } finally {
      setLoading(false)
    }
  }

  const handleClearAll = async () => {
    const unread = notifications.filter(n => !n.read)
    if (unread.length === 0) {
      toast.error('No unread notifications to clear.')
      return
    }
    try {
      setLoading(true)
      const promises = unread.map(n => api.put(`/notifications/${n.id}/read`))
      await Promise.all(promises)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      toast.success('All notifications marked as read!')
    } catch (err) {
      console.error('Failed to clear notifications', err)
      toast.error('Failed to update notifications.')
    } finally {
      setLoading(false)
    }
  }

  const filteredNotifications = notifications.filter((item) => {
    return item.title.toLowerCase().includes(query.toLowerCase()) || 
           item.message.toLowerCase().includes(query.toLowerCase())
  })



  if (loading && notifications.length === 0) {
    return <Loader label="Loading notifications..." />
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Notifications"
        subtitle="Review stock level warnings, transaction status changes, and system diagnostic logs."
        action={notifications.some(n => !n.read) ? "Mark all as read" : undefined}
        onActionClick={handleClearAll}
      />

      <section className="toolbar-card">
        <div className="toolbar-controls">
          <SearchBar placeholder="Search notifications..." value={query} onChange={(event) => { setQuery(event.target.value) }} />
        </div>
        {notifications.some(n => !n.read) && (
          <Button variant="ghost" onClick={handleClearAll}>Mark all as read</Button>
        )}
      </section>

      {filteredNotifications.length === 0 ? (
        <EmptyState title="No notifications" description="You have no notifications or alerts at this time." />
      ) : (
        <>
          <Table
            columns={[
              { key: 'type', header: 'Type', render: (row) => <span style={{ fontSize: '1.2rem' }}>{getIcon(row.type)}</span> },
              { key: 'title', header: 'Alert Title', render: (row) => <strong style={{ color: row.read ? 'var(--muted)' : 'var(--text)', fontWeight: row.read ? '500' : '700' }}>{row.title}</strong> },
              { key: 'message', header: 'Details', render: (row) => <span style={{ color: row.read ? 'var(--muted)' : 'var(--text)', opacity: row.read ? 0.75 : 1 }}>{row.message}</span> },
              { key: 'createdAt', header: 'Timestamp', render: (row) => <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{new Date(row.createdAt).toLocaleString()}</span> },
              { key: 'read', header: 'Status', render: (row) => <Badge variant={row.read ? 'success' : 'warning'}>{row.read ? 'Read' : 'New'}</Badge> },
              { key: 'actions', header: 'Actions', render: (row) => (
                <div className="action-cell">
                  {!row.read ? (
                    <button type="button" className="text-btn" onClick={() => handleMarkRead(row.id)}>Mark Read</button>
                  ) : (
                    <span style={{ color: 'var(--muted)', fontSize: '0.85rem', padding: '0 8px' }}>✓ Read</span>
                  )}
                </div>
              ) }
            ]}
            rows={filteredNotifications}
          />
        </>
      )}
    </div>
  )
}
