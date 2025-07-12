'use client'

import BaseTable from '@/components/base-table'
import style from './style.module.scss'
import { App, Button, Flex, Input, Segmented } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import CalendarIcon from '@/components/icon/calendar_view.svg'
import ListIcon from '@/components/icon/list_view.svg'
import PlusIcon from '@/components/icon/plus.svg'
import SearchIcon from '@/components/icon/search.svg'
import FunnelIcon from '@/components/icon/funnel.svg'
import SortIcon from '@/components/icon/sort.svg'
import GearIcon from '@/components/icon/columns-grear.svg'
import { useRouter, useSearchParams } from 'next/navigation'
import convertSearchParams from '@/utils/app'
import { stringify } from 'querystring'
import useSWR from 'swr'
import moment from 'moment'
import classNames from 'classnames'
import NewEvent from './components/new-event'
// DEV-ONLY: Changed from alias import to relative path to fix module not found error in dev mode. Revert to alias if project structure changes back.
import Filter from './components/filter'
// DEV-ONLY: Changed from alias import to relative path to fix module not found error in dev mode. Revert to alias if project structure changes back.
import EventDetailModal from './components/event-detail-modal'
// DEV-ONLY: Changed from alias import to relative path to fix module not found error in dev mode. Revert to alias if project structure changes back.
import EditEvent from './components/edit-event'
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons'
import CalendarView from './components/calendar'
import dayjs, { Dayjs } from 'dayjs'
import LeftIcon from '@/components/icon/left.svg'
import RightIcon from '@/components/icon/right.svg'

function Event() {
  const searchParams = useSearchParams()
  const queryParams = convertSearchParams(searchParams)
  const API_KEY = `/api/events?${stringify(queryParams)}`
  const {data: dataSource, isLoading, isValidating, mutate} = useSWR(API_KEY)
  const [isOpenNewEvent, showNewEvent] = useState(false)
  const [isOpenEditEvent, showEditEvent] = useState(false)
  const [isOpenFilter, showFilter] = useState(false)
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(dayjs())
  const [isShowEventDetail, showEventDetail] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [isSort, enableSort] = useState(false)
  const { notification } = App.useApp()
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [searchkey, setSearchKey] = useState('')

  useEffect(() => {
    setSearchKey(queryParams?.name)
  }, [queryParams?.name])

  const viewMode = queryParams.viewMode || 'list'
  const setViewMode = useCallback((mode: string) => {
    if (mode === 'calendar') {
      redirectCalendar(dayjs())
    } else {
      queryParams.viewMode = mode
      delete queryParams.startDate
      delete queryParams.endDate
      delete queryParams.sortBy 
      delete queryParams.sortDirection
      const newQuery = stringify(queryParams)
      router.push(`?${newQuery}`)
    }
  }, [queryParams])

  const hasFilter = useMemo(() => {
    if (
      queryParams.startDate || queryParams.endDate || queryParams.range || queryParams.eventTypeIds || queryParams.location
    ) return true
    return false
  }, [searchParams.size])

  // useEffect(() => {
  //   setLoading(isLoading)
  // }, [isLoading])

  const sort = useCallback((sortBy: string, sortDirection = 'desc') => {
    queryParams.sortBy = sortBy
    queryParams.sortDirection = sortDirection
    const newQuery = stringify(queryParams)
    router.push(`?${newQuery}`)
  }, [queryParams])

  const renderHeader = useCallback((title: string, dataIndex: string) => {
    if (!isSort) return title

    return (
      <Flex className={style.header} justify='space-between' align='center'>
        <span>{title}</span>
        {(!queryParams.sortBy || queryParams.sortBy !== dataIndex) && <SortIcon onClick={() => sort(dataIndex)} />}
        {(queryParams.sortBy === dataIndex && queryParams.sortDirection === 'desc') && <ArrowUpOutlined onClick={() => sort(dataIndex, 'asc')} />}
        {(queryParams.sortBy === dataIndex && queryParams.sortDirection === 'asc') && <ArrowDownOutlined onClick={() => sort(dataIndex, 'desc')} />}
      </Flex>
    )
  }, [queryParams.sortBy, queryParams.sortDirection, isSort])

  const columns = useMemo(() => [
    {
      title: renderHeader('Title', 'name'),
      dataIndex: 'name',
    },
    {
      title: renderHeader('Date & Time', 'startTime'),
      render: (data: any) => {
        return moment(data.startTime).format('MMM D, h:mm A')
      }
    },
    {
      title: 'Location',
      render: (data: any) => {
        return data.location + ' - ' + data.venue
      }
    },
    {
      title: 'Type',
      render: (data: any) => {
        return <span className={style.eventType} style={{ backgroundColor: data.eventType.color, color: data.eventType.txtColor }}>{data.eventType.name}</span>
      }
    },
    {
      title: 'Opposition Team',
      render: (data: any) => {
        return data.oppositionTeam || 'N/A'
      }
    },
    {
      title: 'Notifications',
      render: (data: any) => {
        return 'N/A'
      }
    },
    {
      title: 'Spend',
      render: (data: any) => {
        return 'N/A'
      }
    }
  ], [queryParams.sortBy, queryParams.sortDirection, isSort])

  const openNewEvent = () => {
    showNewEvent(true)
  }

  const refreshEvent = () => {
    mutate()
  }

  const openFilter = () => {
    showFilter(true)
  }

  const handlePrevMonth = () => {
    setCurrentDate(prev => prev.subtract(1, 'month'));
    const pivot = currentDate.subtract(1, 'month')
    redirectCalendar(pivot)
  }

  const handleNextMonth = () => {
    setCurrentDate(prev => prev.add(1, 'month'))
    const pivot = currentDate.add(1, 'month')
    redirectCalendar(pivot)
  }

  const redirectCalendar = useCallback((pivotDate: Dayjs) => {
    const startOfMonth = pivotDate.startOf('month')
    const endOfMonth = pivotDate.endOf('month')
    const startDate = startOfMonth.subtract(11, 'day')
    const endDate = endOfMonth.add(11, 'day')

    queryParams.viewMode = 'calendar'
    queryParams.startDate = startDate.format('YYYY-MM-DD')
    queryParams.endDate = endDate.format('YYYY-MM-DD')
    queryParams.sortBy = 'createdAt'
    queryParams.sortDirection = 'asc'
    const newQuery = stringify(queryParams)
    router.push(`?${newQuery}`)

    enableSort(false)
  }, [queryParams])

  const openEventDetail = useCallback((event: any) => {
    setSelectedEvent(event)
    showEventDetail(true)
  }, [])

  const onCloseEventDetail = () => {
    showEventDetail(false)
    // setSelectedEvent(null)
  }

  const onRow = useCallback((record: any) => ({
    onClick: () => {
      openEventDetail(record)
    },
    style: { cursor: 'pointer' }, // optional styling
  }), [])

  const toggleSort = () => {
    enableSort(!isSort)
    // Turn off sort
    if (isSort && viewMode === 'list' && queryParams.sortBy) {
      delete queryParams.sortBy 
      delete queryParams.sortDirection
      const newQuery = stringify(queryParams)
      router.push(`?${newQuery}`)
    }
  }

  const openEditEvent = () => {
    showEditEvent(true)
    showEventDetail(false)
  }

  const handleSearch = async () => {
    // if (!searchkey.trim()) {
    //   notification.error({
    //     message: null, // suppress default title
    //     description: 'Please enter a search keyword',
    //     style: {
    //       backgroundColor: '#2c1618',
    //       border: '1px solid #5b2526',
    //       borderRadius: 8,
    //       padding: '8px 16px 16px'
    //     },
    //     closeIcon: false
    //   })
    //   return
    // }

    queryParams.name = searchkey
    const newQuery = stringify(queryParams)
    router.push(`?${newQuery}`)
  }

  const onChangeSearch = (e: any) => {
    setSearchKey(e.target.value)
  }

  return (
    <>
      <div className={style.container}>
        <Flex justify="space-between" align="center" style={{ marginBottom: 10 }}>
          <Flex align='flex-end' gap={16}>
            <div className={style.title}>Events</div>
            <Segmented
              value={viewMode}
              onChange={setViewMode}
              options={[
                { label: 'Calendar View', value: 'calendar', icon: <CalendarIcon /> },
                { label: 'List View', value: 'list', icon: <ListIcon /> },
              ]}
            />
          </Flex>
          <Button type="primary" icon={<PlusIcon />} onClick={openNewEvent}>Create New Event</Button>
        </Flex>
        <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
          <Flex align="center" gap={24}>
            <Input
              prefix={<SearchIcon />}
              placeholder="Search"
              className={style.search}
              value={searchkey}
              onChange={onChangeSearch}
              onPressEnter={handleSearch}
              allowClear
            />
            {viewMode === 'calendar' &&
              <div className={style.monthControll}>
                <span className={style.month}>{currentDate.format('MMMM YYYY')}</span>
                <span className={style.btnMonth} onClick={handlePrevMonth}><LeftIcon /></span>
                <span className={style.btnMonth} onClick={handleNextMonth}><RightIcon /></span>
              </div>
            }
          </Flex>
          <Flex align='center' gap={10}>
            <Button type="primary" className={classNames({[style.filter]: !hasFilter})} icon={<FunnelIcon />} onClick={openFilter}>Filters</Button>
            <Button type="primary" className={classNames({[style.sort]: !isSort})} icon={<SortIcon />} onClick={toggleSort}>Sort</Button>
            <Button type="primary" icon={<GearIcon />}></Button>
          </Flex>
        </Flex>
        {viewMode === 'list' &&
          <BaseTable
            bordered
            onRow={onRow}
            dataSource={dataSource}
            columns={columns}
            loading={isLoading || isValidating}
          />
        }
        {viewMode === 'calendar' &&
          <CalendarView dataSource={dataSource} currentDate={currentDate} showEventDetail={openEventDetail} />
        }
      </div>
      <NewEvent isOpen={isOpenNewEvent} showOpen={showNewEvent} onRefresh={refreshEvent} />
      <EditEvent event={selectedEvent} isOpen={isOpenEditEvent} showOpen={showEditEvent} onRefresh={refreshEvent} />
      <Filter isOpen={isOpenFilter} showOpen={showFilter} />
      <EventDetailModal isShowModal={isShowEventDetail} onClose={onCloseEventDetail} event={selectedEvent} openEdit={openEditEvent} />
    </>
  )
}

export default Event