import { Modal } from 'antd'
import { memo } from 'react'

interface DeleteConfirmationModalProps {
  isOpen?: boolean
  open?: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  content?: string
  itemName?: string
  itemType: 'note' | 'goal' | 'budget bucket' | 'event' | 'task'
  loading?: boolean
}

function DeleteConfirmationModal({
  isOpen,
  open,
  onClose,
  onConfirm,
  title,
  content,
  itemName,
  itemType,
  loading = false
}: DeleteConfirmationModalProps) {
  const modalOpen = isOpen ?? open ?? false
  
  const getItemTypeDisplay = () => {
    switch (itemType) {
      case 'note':
        return 'Note'
      case 'goal':
        return 'Goal'
      case 'budget bucket':
        return 'Budget Bucket'
      case 'event':
        return 'Event'
      case 'task':
        return 'Task'
      default:
        return 'Item'
    }
  }

  const getItemName = () => {
    if (itemName) {
      return `"${itemName}"`
    }
    return `this ${itemType}`
  }

  return (
    <Modal
      title={`Delete ${getItemTypeDisplay()}`}
      open={modalOpen}
      onCancel={onClose}
      onOk={onConfirm}
      confirmLoading={loading}
      okText="Delete"
      cancelText="Cancel"
      okButtonProps={{
        danger: true,
        type: 'primary'
      }}
      width={400}
    >
      <p>Are you sure you want to delete {getItemName()}?</p>
      <p style={{ marginTop: 6, color: '#ff4d4f', fontSize: '14px' }}>
        This action cannot be undone.
      </p>
    </Modal>
  )
}

export default memo(DeleteConfirmationModal)