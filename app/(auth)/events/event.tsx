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
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch'
import ColumnEditor from './components/column-editor'
import { DashboardRefreshProvider, useDashboardRefresh } from '@/contexts/DashboardRefreshContext'

function EventContent() {
  const searchParams = useSearchParams()
  const queryParams = convertSearchParams(searchParams)
  const { refreshAll } = useDashboardRefresh()
  
  // Create API params excluding eventTypeName sorting
  const apiParams = { ...queryParams }
  if (apiParams.sortBy === 'eventTypeName') {
    delete apiParams.sortBy
    delete apiParams.sortDirection
  }
  
  const API_KEY = `/api/events?${stringify(apiParams)}`
  console.log('Events page - API call:', { apiParams, API_KEY })
  const {data: response, isLoading, isValidating, mutate} = useSWR(API_KEY)
  const rawDataSource = response?.data || []
  
  // Apply client-side sorting for event type
  const dataSource = useMemo(() => {
    console.log('Current sortBy:', queryParams.sortBy, 'sortDirection:', queryParams.sortDirection)
    
    if (!queryParams.sortBy || queryParams.sortBy !== 'eventTypeName') {
      console.log('Not sorting by eventTypeName, returning raw data')
      return rawDataSource
    }
    
    console.log('Applying client-side sorting for eventTypeName:', queryParams.sortDirection)
    
    const sortedData = [...rawDataSource].sort((a, b) => {
      const aType = a.event_types?.name || 'Unknown'
      const bType = b.event_types?.name || 'Unknown'
      
      if (queryParams.sortDirection === 'asc') {
        return aType.localeCompare(bType)
      } else {
        return bType.localeCompare(aType)
      }
    })
    
    console.log('Sorted event types:', sortedData.map(item => item.event_types?.name))
    return sortedData
  }, [rawDataSource, queryParams.sortBy, queryParams.sortDirection])
  
  // Debug: Log the data being returned
  useEffect(() => {
    console.log('Events dataSource:', dataSource)
    console.log('Events API_KEY:', API_KEY)
    console.log('Events isLoading:', isLoading)
    console.log('Events isValidating:', isValidating)
    console.log('Events dataSource type:', typeof dataSource)
    console.log('Events dataSource isArray:', Array.isArray(dataSource))
    console.log('Events dataSource length:', dataSource?.length)
    if (dataSource && Array.isArray(dataSource)) {
      console.log('Events first item:', dataSource[0])
    }
  }, [dataSource, API_KEY, isLoading, isValidating])
  
  const [isOpenNewEvent, showNewEvent] = useState(false)
  const [isOpenEditEvent, showEditEvent] = useState(false)
  const [isOpenFilter, showFilter] = useState(false)
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(dayjs())
  const [isShowEventDetail, showEventDetail] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const { notification } = App.useApp()
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [eventDefaultVals, setEventDefaultVals] = useState({})
  const [columnConfig, setColumnConfig] = useState([
    { key: 'name', title: 'Title', visible: true, sortable: true },
    { key: 'startTime', title: 'Date & Time', visible: true, sortable: true },
    { key: 'type', title: 'Type', visible: true, sortable: true },
    { key: 'location', title: 'Location', visible: true, sortable: false },
    { key: 'details', title: 'Details', visible: true, sortable: false },
  ])

  // Debounced search functionality
  const handleDebouncedSearch = useCallback((searchTerm: string) => {
    const currentParams = convertSearchParams(searchParams);
    if (searchTerm.trim()) {
      currentParams.name = searchTerm
    } else {
      delete currentParams.name
    }
    const newQuery = stringify(currentParams)
    router.push(`?${newQuery}`)
  }, [searchParams, router])

  const {
    searchTerm: searchkey,
    setSearchTerm: setSearchKey,
    isSearching,
    handleImmediateSearch,
    clearSearch
  } = useDebouncedSearch(queryParams?.name || '', 500, handleDebouncedSearch);

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
    return (
      <Flex className={style.header} justify='space-between' align='center'>
        <span>{title}</span>
        {(!queryParams.sortBy || queryParams.sortBy !== dataIndex) && <SortIcon onClick={() => sort(dataIndex)} />}
        {(queryParams.sortBy === dataIndex && queryParams.sortDirection === 'desc') && <ArrowUpOutlined onClick={() => sort(dataIndex, 'asc')} />}
        {(queryParams.sortBy === dataIndex && queryParams.sortDirection === 'asc') && <ArrowDownOutlined onClick={() => sort(dataIndex, 'desc')} />}
      </Flex>
    )
  }, [queryParams.sortBy, queryParams.sortDirection])

  const columns = useMemo(() => {
    const columnDefinitions = {
      name: {
        title: renderHeader('Title', 'name'),
        dataIndex: 'name',
        key: 'name',
        ellipsis: true,
        width: '20%',
      },
      startTime: {
        title: renderHeader('Date & Time', 'startTime'),
        key: 'startTime',
        ellipsis: true,
        width: '18%',
        render: (data: any) => {
          return moment(data.startTime).format('MMM D, h:mm A')
        }
      },
      type: {
        title: renderHeader('Type', 'eventTypeName'),
        key: 'type',
        ellipsis: true,
        width: '15%',
        render: (data: any) => {
          return <span className={style.eventType} style={{ backgroundColor: data.event_types?.color || '#1890ff', color: '#ffffff' }}>{data.event_types?.name || 'Unknown'}</span>
        }
      },
      location: {
        title: 'Location',
        key: 'location',
        ellipsis: true,
        width: '20%',
        render: (data: any) => {
          return data.location + ' - ' + data.venue
        }
      },
      details: {
        title: 'Details',
        key: 'details',
        ellipsis: true,
        width: '27%',
        render: (data: any) => {
          const eventType = data.event_types?.name?.toLowerCase()
          const info = data.oppositionTeam || 'TBD'
          const coaches = ''
          const extra = data.notes || ''

          if (eventType === 'meeting' || eventType === 'practice' || eventType === 'workout') {
            return (
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <strong>Coach Event:</strong> {info}{extra ? (<><strong> | Notes: </strong>{extra}</>) : null}
              </div>
            )
          } else if (eventType === 'game' || eventType === 'scrimmage') {
            return (
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <strong>Opponent:</strong> {info}{extra ? (<><strong> | Notes: </strong>{extra}</>) : null}
              </div>
            )
          } else {
            return (
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <strong>Details:</strong> {info}{extra ? (<><strong> | Notes: </strong>{extra}</>) : null}
              </div>
            )
          }
        }
      }
    }

    return columnConfig
      .filter(col => col.visible)
      .map(col => columnDefinitions[col.key as keyof typeof columnDefinitions])
  }, [queryParams.sortBy, queryParams.sortDirection, columnConfig])

  const openNewEvent = () => {
    showNewEvent(true)
  }

  const refreshEvent = () => {
    mutate() // Refresh the events list
    refreshAll() // Refresh all dashboard components
  }

  const resetToDefaultView = () => {
    // Reset to default view with no filters
    router.push('/events')
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

  const openEditEvent = () => {
    showEditEvent(true)
    showEventDetail(false)
  }

  const handleDeleteEvent = async (eventId: number) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        notification.success({
          message: 'Event deleted successfully',
          description: 'The event has been permanently removed.'
        });
        mutate(); // Refresh the events list
        showEventDetail(false); // Close detail modal
        setSelectedEvent(null);
      } else {
        const error = await response.json();
        notification.error({
          message: 'Failed to delete event',
          description: error.error || 'An error occurred while deleting the event.'
        });
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      notification.error({
        message: 'Failed to delete event',
        description: 'An error occurred while deleting the event.'
      });
    }
  };

  const onChangeSearch = (e: any) => {
    setSearchKey(e.target.value)
  }

  const handleColumnsChange = (newColumns: any[]) => {
    setColumnConfig(newColumns)
  }

  const handleColumnReorder = (fromIndex: number, toIndex: number) => {
    const newColumns = [...columnConfig]
    const [movedColumn] = newColumns.splice(fromIndex, 1)
    newColumns.splice(toIndex, 0, movedColumn)
    setColumnConfig(newColumns)
  }

  return (
    <>
      <div className={style.container}>
        <Flex justify="space-between" align="center" style={{ marginBottom: 10 }}>
          <Flex align='flex-end' gap={16}>
            <div className={style.title} onClick={resetToDefaultView} style={{ cursor: 'pointer' }}>Events</div>
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
              onChange={(e) => setSearchKey(e.target.value)}
              onPressEnter={handleImmediateSearch}
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
            <ColumnEditor 
              columns={columnConfig}
              onColumnsChange={handleColumnsChange}
              onReorder={handleColumnReorder}
            />
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
          <CalendarView 
            dataSource={dataSource} 
            currentDate={currentDate} 
            showEventDetail={openEventDetail}
            addEvent={(defaultValues: any) => {
              setEventDefaultVals(defaultValues)
              openNewEvent()
            }}
          />
        }
      </div>
      <NewEvent isOpen={isOpenNewEvent} showOpen={showNewEvent} onRefresh={refreshEvent} defaultValues={eventDefaultVals} />
      <EditEvent event={selectedEvent} isOpen={isOpenEditEvent} showOpen={showEditEvent} onRefresh={refreshEvent} />
      <Filter isOpen={isOpenFilter} showOpen={showFilter} />
      <EventDetailModal 
        isShowModal={isShowEventDetail} 
        onClose={onCloseEventDetail} 
        event={selectedEvent} 
        openEdit={openEditEvent}
        onDelete={handleDeleteEvent}
      />
    </>
  )
}

function Event() {
  return (
    <DashboardRefreshProvider>
      <EventContent />
    </DashboardRefreshProvider>
  )
}

export default Event