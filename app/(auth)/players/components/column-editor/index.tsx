'use client'

import { Button, Modal, List, Switch, Flex, Typography } from 'antd'
import { useState, useCallback } from 'react'
import GearIcon from '@/components/icon/columns-grear.svg'
import style from './style.module.scss'

interface ColumnConfig {
  key: string
  title: string
  visible: boolean
  sortable: boolean
}

interface ColumnEditorProps {
  columns: ColumnConfig[]
  onColumnsChange: (columns: ColumnConfig[]) => void
  onReorder: (fromIndex: number, toIndex: number) => void
}

function ColumnEditor({ columns, onColumnsChange, onReorder }: ColumnEditorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns)

  const handleOpen = () => {
    setIsOpen(true)
    setLocalColumns([...columns])
  }

  const handleClose = () => {
    setIsOpen(false)
    setIsEditing(false)
    setLocalColumns([...columns])
  }

  const handleSave = () => {
    onColumnsChange(localColumns)
    setIsOpen(false)
    setIsEditing(false)
  }

  const toggleColumnVisibility = (key: string) => {
    const updatedColumns = localColumns.map(col => 
      col.key === key ? { ...col, visible: !col.visible } : col
    )
    setLocalColumns(updatedColumns)
  }

  const moveColumn = (fromIndex: number, toIndex: number) => {
    if (isEditing) {
      const newColumns = [...localColumns]
      const [movedColumn] = newColumns.splice(fromIndex, 1)
      newColumns.splice(toIndex, 0, movedColumn)
      setLocalColumns(newColumns)
    }
  }

  const toggleEditMode = () => {
    setIsEditing(!isEditing)
  }

  return (
    <>
      <Button 
        type="primary" 
        className={style.columnButton}
        icon={<GearIcon />} 
        onClick={handleOpen}
      >
        Columns
      </Button>

      <Modal
        title={
          <Flex justify="space-between" align="center" style={{ width: '100%', paddingRight: '40px' }}>
            <Typography.Text style={{ color: '#ffffff', fontSize: '18px', fontWeight: 600 }}>Column Settings</Typography.Text>
            <Button 
              type={isEditing ? "primary" : "default"}
              onClick={toggleEditMode}
              size="small"
              style={{
                background: isEditing ? '#1D75D0' : 'rgba(255, 255, 255, 0.1)',
                borderColor: isEditing ? '#1D75D0' : 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                borderRadius: '6px',
                fontWeight: 500,
                marginLeft: 'auto'
              }}
            >
              {isEditing ? "Stop Editing" : "Reorder"}
            </Button>
          </Flex>
        }
        open={isOpen}
        onCancel={handleClose}
        className={style.columnSettingsModal}
        footer={null}
        width={420}
      >
        <div className={style.modalContentArea}>
          
          <List
            dataSource={localColumns}
            renderItem={(item, index) => (
              <List.Item
                className={style.columnItem}
                style={{ 
                  cursor: isEditing ? 'move' : 'default'
                }}
                onClick={() => isEditing ? null : toggleColumnVisibility(item.key)}
                onDragStart={isEditing ? (e) => e.dataTransfer.setData('text/plain', index.toString()) : undefined}
                onDragOver={isEditing ? (e) => e.preventDefault() : undefined}
                onDrop={isEditing ? (e) => {
                  e.preventDefault()
                  const fromIndex = parseInt(e.dataTransfer.getData('text/plain'))
                  moveColumn(fromIndex, index)
                } : undefined}
                draggable={isEditing}
              >
                <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                  <Flex align="center" gap={8}>
                    {isEditing && (
                      <div className={style.dragHandle}>⋮⋮</div>
                    )}
                    <Typography.Text style={{ color: '#ffffff', fontSize: '15px', fontWeight: 500 }}>{item.title}</Typography.Text>
                  </Flex>
                  <Switch
                    checked={item.visible}
                    onChange={() => toggleColumnVisibility(item.key)}
                    disabled={isEditing}
                  />
                </Flex>
              </List.Item>
            )}
          />
        </div>

        <Flex justify="space-between" align="center" className={style.modalFooter}>
          <Typography.Text className={style.dragInstructionText}>
            {isEditing ? "Drag and drop to reorder columns" : ""}
          </Typography.Text>
          <Flex gap={10}>
            <Button key="cancel" onClick={handleClose} className={style.cancelButton}>
              Cancel
            </Button>
            <Button key="save" type="primary" onClick={handleSave} className={style.saveButton}>
              Save
            </Button>
          </Flex>
        </Flex>
      </Modal>
    </>
  )
}

export default ColumnEditor
