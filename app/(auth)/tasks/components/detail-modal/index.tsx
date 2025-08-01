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
  DONE: 'Done'
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
          <Flex className={style.header} justify="space-between" align='flex-end' style={{ marginBottom: 16 }}>
            <Flex gap={8}>
              <div className={style.title}>{task?.name}</div>
              <Tooltip title="Edit Event">
                <EditFilled className={style.edit} onClick={openEdit} />
              </Tooltip>
            </Flex>
            <CloseIcon onClick={onClose} />
          </Flex>
          <div>
            <div className={style.subtitle}>
              <span className={classNames(style.priority, style[task?.priority.name])}>{task?.priority.name}</span>
              <span>{task?.description}</span>
            </div>
            <div>
              <i>Due date:</i> <b>{moment(task?.dueDate).format('MMMM D, YYYY')}</b>
            </div>
            <div style={{ marginBottom: 16 }}>
              <i>Status:</i> <b>{STATUS[task?.status]}</b>
            </div>
            <div className={style.sectionAssignee}>
              <Flex justify="space-between" align="center" className={style.header}>
                <div className={style.title}><UserIcon /><span>{Array.isArray(task?.playerTasks) ? task.playerTasks.length : 0} Asignees</span></div>
              </Flex>
              {Array.isArray(task?.playerTasks) && task.playerTasks.map((item: any) =>
                <Row key={item.player.id}>
                  <Col span={8}>👤 {item.player.name}</Col>
                </Row>
              )}
            </div>
          </div>
        </>
      }
    </Modal>
  )
}

export default memo(TaskDetailModal)