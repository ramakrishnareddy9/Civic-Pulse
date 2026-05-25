import React from 'react'
import { Button } from '@components/common/Button'
import { Modal } from '@components/common/Modal'

export function ConfirmModal({ isOpen, title = 'Confirm', message, loading = false, onConfirm, onClose, confirmText = 'Confirm', cancelText = 'Cancel' }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={(
      <div className="flex gap-3">
        <Button variant="secondary" fullWidth onClick={onClose} disabled={loading}>{cancelText}</Button>
        <Button variant="danger" fullWidth onClick={onConfirm} loading={loading}>{confirmText}</Button>
      </div>
    )}>
      <div className="py-2 text-gray-700">{message}</div>
    </Modal>
  )
}

export default ConfirmModal
