import './custom-locale'
import { Calendar, CalendarProps } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { memo, useCallback } from 'react'
import updateLocale from 'dayjs/plugin/updateLocale'
import style from './style.module.scss'

dayjs.extend(updateLocale)

dayjs.updateLocale('en', {
  weekStart: 1,
  weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
})

const COLOR = {
  High: '#DA2F36',
  Medium: '#FF9800',
  Low: '#1D75D0',
}

const CalendarView = ({dataSource, currentDate, showEventDetail}: any) => {
  const entries: Array<any> = dataSource?.tasks || []

  const dateCellRender = useCallback((value: Dayjs) => {
    const result: Array<any> = []
    for (let i = 0; i < entries.length; i++) {
      const item = entries[i]
      if (value.isSame(dayjs(item.dueDate), 'day')) {
        // @ts-ignore
        result.push({id: item.id, name: item.name, color: COLOR[item.priority.name]})
      }
      if (result.length >= 5) break
    }
    return (
      <ul className={style.tasks}>
        {result.map((item: any) => (
          <li key={item.id} style={{ backgroundColor: item.color, color: 'white', cursor: 'pointer' }} onClick={() => showEventDetail(item.id)}>
            <span>{item.name}</span>
          </li>
        ))}
      </ul>
    )
  }, [entries])

  const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
    if (info.type === 'date') return dateCellRender(current)
    return info.originNode
  }

  return (
    <div className={style.container}>
      <Calendar
        value={currentDate}
        fullscreen
        className="border rounded"
        mode="month"
        cellRender={cellRender}
        headerRender={() => null}
        disabledDate={() => true}
      />
    </div>
  )
}

export default memo(CalendarView)