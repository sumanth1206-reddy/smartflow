import React from 'react'
import Modal from './Modal'
import Button from './Button'

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  return (
    <Modal open={open} title={title} onClose={onCancel} footer={
      <>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={onConfirm}>Confirm</Button>
      </>
    }>
      <p>{message}</p>
    </Modal>
  )
}
