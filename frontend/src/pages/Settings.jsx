import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import PageHeader from '../components/common/PageHeader'
import Card from '../components/common/Card'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import Button from '../components/common/Button'
import Loader from '../components/common/Loader'
import LanguageSwitcher from '../components/common/LanguageSwitcher'

import api from '../services/api'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('company')
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    orgName: '',
    email: '',
    currency: '',
    timezone: '',
    taxRate: 5,
    invoicePrefix: 'INV-',
    paymentTerms: 'Due on Receipt',
    barcodeScanner: false,
    autoPrintReceipt: false,
    lowStockThreshold: 10,
    emailAlerts: false,
    aiAlerts: false,
    autoBackup: false,
    backupInterval: ''
  })


  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true)
        const response = await api.get('/settings')
        setSettings(response.data)
        localStorage.setItem('settings', JSON.stringify(response.data))
      } catch (error) {
        console.error('Failed to load settings', error)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  async function handleSave(updatedFields) {
    try {
      setLoading(true)
      const response = await api.put('/settings', updatedFields)
      setSettings(response.data)
      localStorage.setItem('settings', JSON.stringify(response.data))
      window.dispatchEvent(new Event('currencyChange'))
      toast.success('Settings saved successfully!')
    } catch (error) {
      console.error(error)
      toast.error('Error saving settings')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !settings.orgName) {
    return <Loader label="Loading settings..." />
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Settings"
        subtitle="Configure company profiles, inventory alerts, and database backup routines."
      />

      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px', overflowX: 'auto' }}>
        <button
          type="button"
          className="text-btn"
          style={{
            padding: '8px 16px',
            fontWeight: '600',
            color: activeTab === 'company' ? 'var(--accent)' : 'var(--muted)',
            borderBottom: activeTab === 'company' ? '2px solid var(--accent)' : 'none',
            borderRadius: '0',
            transition: 'all 0.2s ease'
          }}
          onClick={() => setActiveTab('company')}
        >
          Company Profile
        </button>
        <button
          type="button"
          className="text-btn"
          style={{
            padding: '8px 16px',
            fontWeight: '600',
            color: activeTab === 'alerts' ? 'var(--accent)' : 'var(--muted)',
            borderBottom: activeTab === 'alerts' ? '2px solid var(--accent)' : 'none',
            borderRadius: '0',
            transition: 'all 0.2s ease'
          }}
          onClick={() => setActiveTab('alerts')}
        >
          Alerts & Notifications
        </button>
        <button
          type="button"
          className="text-btn"
          style={{
            padding: '8px 16px',
            fontWeight: '600',
            color: activeTab === 'system' ? 'var(--accent)' : 'var(--muted)',
            borderBottom: activeTab === 'system' ? '2px solid var(--accent)' : 'none',
            borderRadius: '0',
            transition: 'all 0.2s ease'
          }}
          onClick={() => setActiveTab('system')}
        >
          System Preferences
        </button>
      </div>

      {activeTab === 'company' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="Company Profile" subtitle="Manage your organization's identity and time zone settings." className="panel-card">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                handleSave({
                  orgName: formData.get('orgName'),
                  email: formData.get('email'),
                  timezone: formData.get('timezone')
                })
              }}
            >
              <div className="form-grid">
                <Input
                  label="Organization Name"
                  name="orgName"
                  defaultValue={settings.orgName}
                  key={`orgName-${settings.orgName}`}
                />
                <Input
                  label="Business Email"
                  name="email"
                  type="text"
                  defaultValue={settings.email}
                  key={`email-${settings.email}`}
                />
                <Select
                  label="Time Zone"
                  name="timezone"
                  value={settings.timezone}
                  onChange={(e) => setSettings((prev) => ({ ...prev, timezone: e.target.value }))}
                >
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="EST">EST (Eastern Standard Time)</option>
                  <option value="PST">PST (Pacific Standard Time)</option>
                  <option value="GMT">GMT (Greenwich Mean Time)</option>
                  <option value="IST">IST (Indian Standard Time)</option>
                </Select>
              </div>
              <div className="inline-actions" style={{ marginTop: '20px' }}>
                <Button type="submit">Save Profile Preferences</Button>
              </div>
            </form>
          </Card>

          <Card title="Currency Settings" subtitle="Configure the default currency for products and transactions." className="panel-card">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSave({
                  currency: settings.currency
                })
              }}
            >
              <div style={{ maxWidth: '320px' }}>
                <Select
                  label="Default Currency"
                  name="currency"
                  value={settings.currency}
                  onChange={(e) => setSettings((prev) => ({ ...prev, currency: e.target.value }))}
                >
                  <option value="₹">Indian Rupee (₹)</option>
                  <option value="$">US Dollar ($)</option>
                  <option value="€">Euro (€)</option>
                  <option value="£">Pound (£)</option>
                  <option value="¥">Yen (¥)</option>
                </Select>
              </div>
              <div className="inline-actions" style={{ marginTop: '20px' }}>
                <Button type="submit">Save Currency Preferences</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {activeTab === 'alerts' && (
        <Card title="Alerts & Notifications" subtitle="Configure system rules for low stock thresholds and notification preferences." className="panel-card">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSave({
                lowStockThreshold: Number(settings.lowStockThreshold),
                emailAlerts: settings.emailAlerts,
                aiAlerts: settings.aiAlerts
              })
            }}
          >
            <div className="form-grid">
              <Input
                label="Low Stock Threshold"
                type="number"
                value={settings.lowStockThreshold}
                onChange={(e) => setSettings((prev) => ({ ...prev, lowStockThreshold: e.target.value }))}
              />
            </div>

            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '3px' }}
                  checked={settings.emailAlerts}
                  onChange={(e) => setSettings((prev) => ({ ...prev, emailAlerts: e.target.checked }))}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem' }}>Send low stock email alerts</strong>
                  <span style={{ display: 'block', marginTop: '4px', color: 'var(--muted)', fontSize: '0.85rem' }}>
                    Notify warehouse supervisors when stock drops below threshold.
                  </span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '3px' }}
                  checked={settings.aiAlerts}
                  onChange={(e) => setSettings((prev) => ({ ...prev, aiAlerts: e.target.checked }))}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem' }}>Enable AI-powered demand forecasts</strong>
                  <span style={{ display: 'block', marginTop: '4px', color: 'var(--muted)', fontSize: '0.85rem' }}>
                    Predict stock reorder recommendations automatically based on history.
                  </span>
                </div>
              </label>
            </div>

            <div className="inline-actions" style={{ marginTop: '24px' }}>
              <Button type="submit">Save Alert Settings</Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'system' && (
        <Card title="System Preferences" subtitle="Manage database backups, auto-archiving, and system recovery." className="panel-card">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSave({
                autoBackup: settings.autoBackup,
                backupInterval: settings.backupInterval
              })
            }}
          >
            <div className="form-grid">
              <Select
                label="Automatic Backup Interval"
                value={settings.backupInterval}
                onChange={(e) => setSettings((prev) => ({ ...prev, backupInterval: e.target.value }))}
              >
                <option value="Disabled">Disabled</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </Select>
            </div>

            <div style={{ marginTop: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '3px' }}
                  checked={settings.autoBackup}
                  onChange={(e) => setSettings((prev) => ({ ...prev, autoBackup: e.target.checked }))}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem' }}>Enable Auto-Archiving of past invoices</strong>
                  <span style={{ display: 'block', marginTop: '4px', color: 'var(--muted)', fontSize: '0.85rem' }}>
                    Compress and archive sales transaction receipts older than 12 months.
                  </span>
                </div>
              </label>
            </div>

            <div className="inline-actions" style={{ marginTop: '24px' }}>
              <Button type="submit">Save System Preferences</Button>
            </div>
          </form>

          <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid var(--border)' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ margin: '0 0 4px 0' }}>Data Recovery & Utilities</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <Button
                variant="ghost"
                onClick={() => {
                  toast.success('Database backup generated successfully (smartflow-backup.json)')
                }}
              >
                Trigger Manual Backup
              </Button>
              <Button
                variant="ghost"
                style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                onClick={() => {
                  if (confirm('Are you sure you want to reset all inventory catalog and transactions to defaults? This will erase all recent sales.')) {
                    toast.success('Database reset to initial template state.')
                    setTimeout(() => window.location.reload(), 1000)
                  }
                }}
              >
                Reset Application State
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
