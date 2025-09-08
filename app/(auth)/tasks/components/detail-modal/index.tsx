import { Button, Col, ColorPicker, Flex, Form, Input, Modal, Row, Skeleton, Tooltip } from 'antd'
import { memo, useEffect, useState } from 'react'
import style from './style.module.scss'
import CloseIcon from '@/components/icon/close.svg'
import CalendarIcon from '@/components/icon/calendar.svg'
import MapIcon from '@/components/icon/map-pin.svg'
import UserIcon from '@/components/icon/users-round.svg'
import api from '@/services/api'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import { EditFilled } from '@ant-design/icons'
import classNames from 'classnames'
import moment from 'moment'

const STATUS: Record<string, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
  ARCHIVE: 'Archive'
}

function TaskDetailModal({isShowModal, onClose, task, openEdit}: any) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
              <Tooltip title="Edit Task">
                <EditFilled className={style.edit} onClick={openEdit} />
              </Tooltip>
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
              

              <div className={style.detailItem}>
                <CalendarIcon className={style.icon} />
                <span className={style.label}>Due Date:</span>
                <span className={style.value}>
                  {task?.dueDate ? moment(task.dueDate).format('MMM D, YYYY') : 'No due date'}
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
    </Modal>
  )
}

export default memo(TaskDetailModal)