import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import PageHeader from '../components/common/PageHeader'
import Card from '../components/common/Card'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, updateUser } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('')
  const [address, setAddress] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
      setPhone(user.phone || '')
      setRole(user.role || '')
      setAddress(user.address || '')
    }
  }, [user])

  async function handleUpdatePassword(e) {
    e.preventDefault()
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match.')
      return
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.')
      return
    }
    
    try {
      const response = await api.put('/auth/profile', { password: newPassword })
      updateUser(response.data.user)
      toast.success('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      console.error(err)
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to update password.'
      toast.error(errMsg)
    }
  }

  function handleCancelPassword() {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  async function handleSave(e) {
    e.preventDefault()
    try {
      const response = await api.put('/auth/profile', { name, email, phone, role, address })
      updateUser(response.data.user)
      toast.success('Profile updated successfully!')
    } catch (err) {
      console.error(err)
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to update profile.'
      toast.error(errMsg)
    }
  }

  const initials = name
    ? name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
    : 'U'

  return (
    <div className="page-stack">
      <PageHeader title="Profile" subtitle="Manage personal and account preferences in one place." />

      <section className="profile-grid">
        <Card title="Profile Overview" subtitle="Your account snapshot" className="panel-card">
          <div className="profile-card">
            <div className="profile-avatar">{initials}</div>
            <div>
              <h3>{name || 'User'}</h3>
              <p>{role || 'Staff'}</p>
              <p>{email || 'No Email'}</p>
            </div>
          </div>
          <div className="info-list">
            <div><span>Phone</span><strong>{phone || 'N/A'}</strong></div>
            <div><span>Role</span><strong>{role || 'N/A'}</strong></div>
            <div><span>Address</span><strong>{address || 'N/A'}</strong></div>
          </div>
        </Card>

        <Card title="Account Information" subtitle="Administrative details" className="panel-card">
          <form onSubmit={handleSave} className="form-grid">
            <Input 
              label="Name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Reddy Sumanth"
            />
            <Input 
              label="Email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="e.g. reddy@example.com"
            />
            <Input 
              label="Phone" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              placeholder="e.g. +1 555 0123"
            />
            <Input 
              label="Role" 
              value={role} 
              onChange={e => setRole(e.target.value)} 
              placeholder="e.g. Admin"
              disabled
            />
            <Input 
              label="Address" 
              value={address} 
              onChange={e => setAddress(e.target.value)} 
              placeholder="e.g. 42 Harbor Avenue"
            />
          </form>
          <div className="inline-actions" style={{ marginTop: '20px' }}>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </Card>
      </section>

      <Card title="Security" subtitle="Update your password and account safety" className="panel-card">
        <form onSubmit={handleUpdatePassword} className="form-grid form-grid-3">
          <Input 
            label="Current Password" 
            type="password" 
            placeholder="••••••••" 
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input 
            label="New Password" 
            type="password" 
            placeholder="••••••••" 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input 
            label="Confirm Password" 
            type="password" 
            placeholder="••••••••" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </form>
        <div className="inline-actions" style={{ marginTop: '20px' }}>
          <Button variant="ghost" onClick={handleCancelPassword}>Cancel</Button>
          <Button onClick={handleUpdatePassword}>Update Password</Button>
        </div>
      </Card>
    </div>
  )
}
