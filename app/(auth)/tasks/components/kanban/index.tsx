import { memo } from 'react'
import style from './style.module.scss'
import { Flex } from 'antd'
import PlusIcon from '@/components/icon/plus2.svg'
import PointIcon from '@/components/icon/point.svg'
import CircleIcon from '@/components/icon/circle.svg'
import TickIcon from '@/components/icon/circle-tick.svg'
import classNames from 'classnames'
import dayjs from 'dayjs'

const Kanban = ({dataSource, addTask}: any) => {
  const todos: Array<any> = dataSource?.todos || []
  const inprogresses: Array<any> = dataSource?.inprogresses || []
  const dones: Array<any> = dataSource?.dones || []

  return (
    <Flex gap={12} className={style.container}>
      <div className={style.list}>
        <Flex justify="space-between" align='center' className={style.heading}>
          <Flex align='center'>
            <PointIcon style={{ marginRight: 12 }} />
            <div style={{ fontSize: 20, fontWeight: 600 }}>To DO <span style={{ fontSize: 16, fontWeight: 'normal' }}>({todos.length})</span></div>
          </Flex>
          <PlusIcon className={style.btnAdd} onClick={() => addTask({ status: 'TODO' })} />
        </Flex>

        {todos.map((item: any) =>
          <div className={style.card} key={item.id}>
            <div className={style.header}>
              <div>{item.name}</div>
              <span className={classNames(style.priority, style[item.priority.name])}>{item.priority.name}</span>
            </div>
            <div className={style.content}>
              {item.description}
            </div>
            <div className={style.footer}>
              <div>{item.playerTasks.length > 0 ? '👤' + item.playerTasks[0].player.name : ''}</div>
              <div className={style.duedate}>{dayjs(item.duedate).format('MMMM D, YYYY')}</div>
            </div>
          </div>
        )}
      </div>
      
      <div className={style.list}>
        <Flex justify="space-between" align='center' className={style.heading}>
          <Flex align='center'>
            <CircleIcon style={{ marginRight: 12 }} />
            <div style={{ fontSize: 20, fontWeight: 600 }}>In Progress <span style={{ fontSize: 16, fontWeight: 'normal' }}>({inprogresses.length})</span></div>
          </Flex>
          <PlusIcon className={style.btnAdd} onClick={() => addTask({ status: 'IN_PROGRESS' })} />
        </Flex>

        {inprogresses.map((item: any) =>
          <div className={style.card} key={item.id}>
            <div className={style.header}>
              <div>{item.name}</div>
              <span className={classNames(style.priority, style[item.priority.name])}>{item.priority.name}</span>
            </div>
            <div className={style.content}>
              {item.description}
            </div>
            <div className={style.footer}>
              <div>{item.playerTasks.length > 0 ? '👤' + item.playerTasks[0].player.name : ''}</div>
              <div className={style.duedate}>{dayjs(item.duedate).format('MMMM D, YYYY')}</div>
            </div>
          </div>
        )}
      </div>

      <div className={style.list}>
        <Flex justify="space-between" align='center' className={style.heading}>
          <Flex align='center'>
            <TickIcon style={{ marginRight: 12 }} />
            <div style={{ fontSize: 20, fontWeight: 600 }}>Complete <span style={{ fontSize: 16, fontWeight: 'normal' }}>({dones.length})</span></div>
          </Flex>
          <PlusIcon className={style.btnAdd} onClick={() => addTask({ status: 'DONE' })} />
        </Flex>

        {dones.map((item: any) =>
          <div className={style.card} key={item.id}>
            <div className={style.header}>
              <div>{item.name}</div>
              <span className={classNames(style.priority, style[item.priority])}>{item.priority}</span>
            </div>
            <div className={style.content}>
              {item.description}
            </div>
            <div className={style.footer}>
              <div>{item.playerTasks.length > 0 ? '👤' + item.playerTasks[0].player.name : ''}</div>
              <div className={style.duedate}>{dayjs(item.duedate).format('MMMM D, YYYY')}</div>
            </div>
          </div>
        )}
      </div>
    </Flex>
  )
}

export default memo(Kanban)