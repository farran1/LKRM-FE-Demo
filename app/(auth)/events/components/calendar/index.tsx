import './custom-locale'
import { Calendar, CalendarProps } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { memo, useCallback } from 'react'
import updateLocale from 'dayjs/plugin/updateLocale'
import style from './style.module.scss'

dayjs.extend(updateLocale)

// Update the short names for weekdays
dayjs.updateLocale('en', {
  weekStart: 1, // Mon
  weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
})

const CalendarView = ({dataSource, currentDate, showEventDetail}: any) => {
  const entries: Array<any> = dataSource?.data || []

  const dateCellRender = useCallback((value: Dayjs) => {
    const result: Array<any> = []
    for (let i = 0; i < entries.length; i++) {
      const item = entries[i]
      if (value.isSame(dayjs(item.startTime), 'day')) {
        result.push({id: item.id, name: item.name, color: item.eventType.color, txtColor: item.eventType.txtColor})
      }
      if (result.length >= 5) break
    }
    return (
      <ul className={style.events}>
        {result.map((item: any) => (
          <li key={item.id} style={{ backgroundColor: item.color, color: item.txtColor, cursor: 'pointer' }} onClick={() => showEventDetail(item.id)}>
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