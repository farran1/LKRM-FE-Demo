import { Button, Col, ColorPicker, Flex, Form, Input, Modal, Row, Skeleton, Tooltip, App } from 'antd'
import { memo, useEffect, useState } from 'react'
import style from './style.module.scss'
import CloseIcon from '@/components/icon/close.svg'
import CalendarIcon from '@/components/icon/calendar.svg'
import MapIcon from '@/components/icon/map-pin.svg'
import UserIcon from '@/components/icon/users-round.svg'
import TrashIcon from '@/components/icon/trash.svg'
import api from '@/services/api'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { EditFilled } from '@ant-design/icons'
import classNames from 'classnames'
import moment from 'moment'
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal'

const STATUS: Record<string, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
  ARCHIVE: 'Archive'
}

function TaskDetailModal({isShowModal, onClose, task, openEdit, onDelete, openEventDetail}: any) {
  const [loading, setLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const router = useRouter()
  const { message } = App.useApp()

  const handleDeleteTask = async () => {
    if (!task) return;

    setDeleteLoading(true);
    try {
      const response = await api.delete(`/api/tasks/${task.id}`);

      if (response.status === 200) {
        message.success('Task deleted successfully');
        onDelete?.(task.id); // Call the parent's delete handler
        setShowDeleteModal(false);
        onClose(); // Close the detail modal after successful deletion
      } else {
        const errorMessage = (response as any)?.data?.error || 'Failed to delete task';
        message.error(errorMessage);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      message.error('Failed to delete task');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Modal
      closeIcon={null}
      open={isShowModal}
      footer={null}
      className={style.container}
      destroyOnHidden
      maskClosable={true}
      onCancel={onClose}
    >
      {!task && <Skeleton active />}
      {task &&
        <>
          <Flex className={style.header} justify="space-between" align="center">
            <Flex gap={8} align="center">
              <div className={style.title}>{task?.name}</div>
              <Flex align="center" gap={8}>
                <Tooltip title="Edit Task">
                  <EditFilled 
                    className={style.edit} 
                    onClick={openEdit}
                    style={{ 
                      cursor: 'pointer', 
                      color: '#1890ff',
                      fontSize: '16px'
                    }}
                  />
                </Tooltip>
                {onDelete && (
                  <TrashIcon 
                    onClick={() => setShowDeleteModal(true)}
                    style={{ 
                      cursor: 'pointer', 
                      color: '#ff4d4f',
                      width: '16px',
                      height: '16px'
                    }}
                  />
                )}
              </Flex>
            </Flex>
            <CloseIcon onClick={onClose} />
          </Flex>
          
          <div className={style.content}>
            {task?.description && (
              <div className={style.descriptionSection}>
                <span className={style.label}>Description:</span>
                <div className={style.description}>
                  {task.description}
                </div>
              </div>
            )}
            
            <div className={style.detailsGrid}>
              <div className={style.detailItem}>
                <span className={style.label}>Priority:</span>
                <span className={classNames(style.priority, style[task?.task_priorities?.name?.toLowerCase() || 'default'])}>
                  {task?.task_priorities?.name || 'No Priority'}
                </span>
              </div>
              

              {task?.events?.name ? (
                <div className={style.detailItem}>
                  <CalendarIcon className={style.icon} />
                  <span className={style.label}>Event:</span>
                  <span 
                    style={{ 
                      color: '#1D75D0', 
                      textDecoration: 'underline',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.textDecoration = 'underline'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.textDecoration = 'underline'}
                    onClick={(e) => {
                      e.stopPropagation() // Prevent any parent click handlers
                      if (openEventDetail && task.events) {
                        openEventDetail(task.events)
                        onClose() // Close the task detail modal when opening event detail
                      }
                    }}
                  >
                    {task.events.name}
                  </span>
                </div>
              ) : (
                <div className={style.detailItem}>
                  <CalendarIcon className={style.icon} />
                  <span className={style.label}>Event:</span>
                  <span className={style.value}>No event</span>
                </div>
              )}
              

              <div className={style.detailItem}>
                <CalendarIcon className={style.icon} />
                <span className={style.label}>Due Date:</span>
                <span className={style.value}>
                  {task?.dueDate ? moment(task.dueDate).format('MM/DD/YY') : 'No due date'}
                </span>
              </div>

              <div className={style.detailItem}>
                <span className={style.label}>Status:</span>
                <span className={style.status}>{STATUS[task?.status] || 'Unknown'}</span>
              </div>
              

              
              {task?.users?.username ? (
                <div className={style.detailItem}>
                  <UserIcon className={style.icon} />
                  <span className={style.label}>Assignee:</span>
                  <span className={style.value}>{task.users.username}</span>
                </div>
              ) : (
                <div className={style.detailItem}>
                  <UserIcon className={style.icon} />
                  <span className={style.label}>Assignee:</span>
                  <span className={style.value}>No assignee</span>
                </div>
              )}
            </div>
          </div>
        </>
      }
      
      <DeleteConfirmationModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        itemName={task?.name || ''}
        itemType="task"
        loading={deleteLoading}
      />
    </Modal>
  )
}

export default memo(TaskDetailModal)