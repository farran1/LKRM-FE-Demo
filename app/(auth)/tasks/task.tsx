'use client'

import BaseTable from '@/components/base-table'
import style from './style.module.scss'
import { App, Button, Flex, Input, Segmented, notification } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import CalendarIcon from '@/components/icon/calendar_view.svg'
import ListIcon from '@/components/icon/list_view.svg'
import ChartIcon from '@/components/icon/chart-bar.svg'
import PlusIcon from '@/components/icon/plus.svg'
import api from '@/services/api'
import SearchIcon from '@/components/icon/search.svg'
import FunnelIcon from '@/components/icon/funnel.svg'
import SortIcon from '@/components/icon/sort.svg'
import GearIcon from '@/components/icon/columns-grear.svg'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import convertSearchParams from '@/utils/app'
import { stringify } from 'querystring'
import useSWR from 'swr'
import moment from 'moment'
import classNames from 'classnames'
import Filter from './components/filter'
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import LeftIcon from '@/components/icon/left.svg'
import RightIcon from '@/components/icon/right.svg'
import NewTask from './components/new-task'
import CalendarView from './components/calendar'
import KanbanView from './components/kanban'
import DetailModal from './components/detail-modal'
import EditTask from './components/edit-task'
import TaskMentionInput from '../dashboard/components/TaskMentionInput'
import EventDetailModal from '../events/components/event-detail-modal'
import ColumnEditor from './components/column-editor'
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch'
import { UserOutlined } from '@ant-design/icons'

function Tasks() {
  const searchParams = useSearchParams()
  const queryParams = convertSearchParams(searchParams)
  const API_KEY = `/api/tasks?${stringify(queryParams)}`
  const {data: response, isLoading, isValidating, mutate} = useSWR(API_KEY)
  
  // Extract tasks and meta from the API response
  const dataSource = response || { data: [], meta: { total: 0, page: 1, perPage: 50 } }
  
  // Transform data for Kanban view
  const kanbanDataSource = useMemo(() => {
    const tasks = dataSource?.data || []
    if (!tasks || tasks.length === 0) {
      return {
        todos: [],
        inprogresses: [],
        dones: [],
        archives: []
      }
    }
    
    // Group tasks by status
    const grouped = {
      todos: [] as any[],
      inprogresses: [] as any[],
      dones: [] as any[],
      archives: [] as any[]
    }
    
    tasks.forEach((task: any) => {
      const status = task.status?.toUpperCase() || 'TODO'
      if (status === 'TODO') {
        grouped.todos.push(task)
      } else if (status === 'IN_PROGRESS') {
        grouped.inprogresses.push(task)
      } else if (status === 'DONE') {
        grouped.dones.push(task)
      } else if (status === 'ARCHIVE') {
        grouped.archives.push(task)
      }
    })
    
    return grouped
  }, [dataSource])
  
  // Debug logging
  useEffect(() => {
    console.log('API Response:', response)
    console.log('Data source:', dataSource)
    console.log('Tasks count:', dataSource?.data?.length || 0)
    console.log('Meta:', dataSource?.meta)
    console.log('Kanban data source:', kanbanDataSource)
  }, [response, dataSource, kanbanDataSource])
  
  const [isOpenFilter, showFilter] = useState(false)
  const [isShowNewTask, showNewTask] = useState(false)
  const [isShowMentionTask, setIsShowMentionTask] = useState(false)
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(dayjs())
  const [taskDefaultVals, setTaskDefaultVals] = useState({})
  const [isShowDetailModal, showDetailModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [isShowEventDetail, showEventDetail] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)

  // Column configuration state
  const [columnConfig, setColumnConfig] = useState([
    { key: 'name', title: 'Title', visible: true, sortable: true },
    { key: 'assignee', title: 'Assignee', visible: true, sortable: true },
    { key: 'event', title: 'Event', visible: true, sortable: true },
    { key: 'description', title: 'Description', visible: true, sortable: false },
    { key: 'status', title: 'Progress', visible: true, sortable: true },
    { key: 'priority', title: 'Priority Level', visible: true, sortable: true },
    { key: 'dueDate', title: 'Due Date', visible: true, sortable: true },
  ])

  // My Tasks filter state
  const [isMyTasksActive, setIsMyTasksActive] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Get current user and check My Tasks filter from URL
  useEffect(() => {
    const checkMyTasksFilter = async () => {
      try {
        // Check if myTasks parameter is in URL
        const myTasksParam = queryParams.myTasks === 'true'
        setIsMyTasksActive(myTasksParam)

        // Get current user info for filtering
        const response = await api.get('/api/auth/user')
        if (response.status === 200) {
          const userData: { user?: any } = response.data as any
          if (userData && (userData as any).user) {
            setCurrentUser((userData as any).user)
          } else {
            setCurrentUser(null)
          }
        }
      } catch (error) {
        console.error('Error getting user info:', error)
      }
    }

    checkMyTasksFilter()
  }, [queryParams.myTasks])

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
  } = useDebouncedSearch(queryParams?.name ?? '', 500, handleDebouncedSearch);
  const [isShowEditTask, showEditTask] = useState(false)

  const handleDeleteTask = async (taskId: number) => {
    try {
      const response = await api.delete(`/api/tasks/${taskId}`);

      if (response.status === 200) {
        notification.success({
          message: 'Task deleted successfully',
          description: 'The task has been permanently removed.'
        });
        mutate(); // Refresh the tasks list
        showDetailModal(false); // Close detail modal
        setSelectedTask(null);
      } else {
        const errorMessage = (response as any)?.data?.error || 'An error occurred while deleting the task.'
        notification.error({
          message: 'Failed to delete task',
          description: errorMessage
        });
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      notification.error({
        message: 'Failed to delete task',
        description: 'An error occurred while deleting the task.'
      });
    }
  };

  useEffect(() => {
    setSearchKey(queryParams?.name ?? '')
  }, [queryParams?.name, setSearchKey])

  const viewMode = queryParams.viewMode || 'list'
  const setViewMode = useCallback((mode: string) => {
    if (mode === 'calendar' || mode === 'progress') {
      redirectViewMode(dayjs(), mode)
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
      queryParams.dueDate || queryParams.playerIds || queryParams.priority || queryParams.myTasks
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

  const toggleMyTasks = useCallback(() => {
    const currentParams = convertSearchParams(searchParams)
    
    if (isMyTasksActive) {
      // Remove My Tasks filter
      delete currentParams.myTasks
    } else {
      // Add My Tasks filter
      currentParams.myTasks = 'true'
    }
    
    const newQuery = stringify(currentParams)
    router.push(`?${newQuery}`)
  }, [isMyTasksActive, searchParams, router])

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
        ellipsis: true,
        width: '25%',
      },
      assignee: {
        title: renderHeader('Assignee', 'assigneeId'),
        ellipsis: true,
        width: '15%',
        render: (data: any) => {
          if (!data.users || !data.users.username) return 'Unknown user'
          return data.users.username
        }
      },
      event: {
        title: renderHeader('Event', 'event'),
        ellipsis: true,
        width: '20%',
        render: (data: any) => {
          if (!data.events || !data.events.name) return 'No event'
          return (
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
                e.stopPropagation() // Prevent row click from opening task detail modal
                openEventDetailModal(data.events)
              }}
            >
              {data.events.name}
            </span>
          )
        }
      },
      description: {
        title: 'Description',
        ellipsis: true,
        width: '20%',
        render: (data: any) => {
          return data.description || 'No description'
        }
      },
      status: {
        title: renderHeader('Progress', 'status'),
        ellipsis: true,
        width: '15%',
        render: (data: any) => {
          const status = data.status?.toUpperCase() || 'TODO'
          const statusLabels = {
            'TODO': 'To do',
            'IN_PROGRESS': 'In Progress', 
            'DONE': 'Done',
            'ARCHIVE': 'Archive'
          }
          return (
            <span className={classNames(style.status, style[status.toLowerCase()])}>
              {statusLabels[status as keyof typeof statusLabels] || status}
            </span>
          )
        }
      },
      priority: {
        title: renderHeader('Priority Level', 'priority'),
        ellipsis: true,
        width: '15%',
        render: (data: any) => {
          if (!data.task_priorities || !data.task_priorities.name) {
            return <span className={classNames(style.priority, style['no-priority'])}>No priority</span>
          }
          return <span className={classNames(style.priority, style[data.task_priorities.name.toLowerCase()])}>{data.task_priorities.name}</span>
        }
      },
      dueDate: {
        title: renderHeader('Due Date', 'dueDate'),
        ellipsis: true,
        width: '15%',
        render: (data: any) => {
          if (!data.dueDate) return 'No due date'
          return moment(data.dueDate).format('MM/DD/YY')
        }
      },
    }

    // Filter and order columns based on configuration
    return columnConfig
      .filter(col => col.visible)
      .map(col => columnDefinitions[col.key as keyof typeof columnDefinitions])
  }, [queryParams.sortBy, queryParams.sortDirection, columnConfig])

  const refreshTask = () => {
    mutate()
  }

  const resetToDefaultView = () => {
    // Reset to default view with no filters
    router.push('/tasks')
  }

  const openFilter = () => {
    showFilter(true)
  }

  const handlePrevMonth = () => {
    setCurrentDate(prev => prev.subtract(1, 'month'));
    const pivot = currentDate.subtract(1, 'month')
    redirectViewMode(pivot, viewMode)
  }

  const handleNextMonth = () => {
    setCurrentDate(prev => prev.add(1, 'month'))
    const pivot = currentDate.add(1, 'month')
    redirectViewMode(pivot, viewMode)
  }

  const redirectViewMode = useCallback((pivotDate: Dayjs, mode: string) => {
    const startOfMonth = pivotDate.startOf('month')
    const endOfMonth = pivotDate.endOf('month')

    let startDate = startOfMonth
    let endDate = endOfMonth
    if (mode === 'calendar') {
      startDate = startOfMonth.subtract(11, 'day')
      endDate = endOfMonth.add(11, 'day')
    }

    queryParams.viewMode = mode
    queryParams.startDate = startDate.format('YYYY-MM-DD')
    queryParams.endDate = endDate.format('YYYY-MM-DD')
    queryParams.sortBy = 'createdAt'
    queryParams.sortDirection = 'asc'
    const newQuery = stringify(queryParams)
    router.push(`?${newQuery}`)
  }, [queryParams, viewMode])


  const openNewTask = (defaultValues = {}) => {
    showNewTask(true)
    setTaskDefaultVals(defaultValues)
  }

  const onCloseDetailModal = () => {
    showDetailModal(false)
  }

  const openEventDetailModal = useCallback((event: any) => {
    setSelectedEvent(event)
    showEventDetail(true)
  }, [])

  const onCloseEventDetailModal = () => {
    showEventDetail(false)
    setSelectedEvent(null)
  }

  const openTaskDetailModal = useCallback((task: any) => {
    setSelectedTask(task)
    showDetailModal(true)
  }, [])

  const onRow = useCallback((record: any) => ({
    onClick: () => {
      openTaskDetailModal(record)
    },
    style: { cursor: 'pointer' }, // optional styling
  }), [])

  const openEditTask = () => {
    console.log('openEditTask called, selectedTask:', selectedTask)
    showEditTask(true)
    showDetailModal(false)
  }

  // Handle task creation with mentions
  const handleTaskCreate = (task: {
    title: string;
    description: string;
    mentions: any[];
    assignedTo?: string;
    priority: 'high' | 'medium' | 'low';
    dueDate?: string;
    event?: string;
  }) => {
    console.log('New task created with mentions:', task);
    setIsShowMentionTask(false);
    refreshTask(); // Refresh the task list
    // Here you would typically save the task to your backend
    // For now, we'll just log it and close the modal
  };

  // Handle task creation cancel
  const handleTaskCancel = () => {
    setIsShowMentionTask(false);
  };

  // Column editor handlers
  const handleColumnsChange = (newColumns: any[]) => {
    setColumnConfig(newColumns);
  };

  const handleColumnReorder = (fromIndex: number, toIndex: number) => {
    const newColumns = [...columnConfig];
    const [movedColumn] = newColumns.splice(fromIndex, 1);
    newColumns.splice(toIndex, 0, movedColumn);
    setColumnConfig(newColumns);
  };

  // Handle task status change from Kanban drag and drop
  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await api.patch(`/api/tasks/${taskId}`, { status: newStatus });

      if (response.status !== 200) {
        throw new Error('Failed to update task status');
      }

      // Refresh the task list to show the updated status
      refreshTask();
    } catch (error) {
      console.error('Error updating task status:', error);
      // You could add a toast notification here to show the error
    }
  };

  return (
    <>
      <div className={style.container}>
        <Flex justify="space-between" align="center" style={{ marginBottom: 10 }}>
          <Flex align='flex-end' gap={16}>
            <div className={style.title} onClick={resetToDefaultView} style={{ cursor: 'pointer' }}>Tasks</div>
            <Segmented
              value={viewMode}
              onChange={setViewMode}
              options={[
                { label: 'List View', value: 'list', icon: <ListIcon /> },
                { label: 'Calendar View', value: 'calendar', icon: <CalendarIcon /> },
                { label: 'Progress View', value: 'progress', icon: <ChartIcon /> },
              ]}
            />
          </Flex>
          <Button type="primary" icon={<PlusIcon />} onClick={openNewTask}>Create New Task</Button>
        </Flex>
        <Flex justify="space-between" align="center" style={{ marginBottom: 10 }}>
          <Flex align="center" gap={24}>
            <Input
              prefix={<SearchIcon />}
              placeholder="Search"
              className={style.search}
              value={searchkey}
              onChange={(e) => setSearchKey(e.target.value as string)}
              onPressEnter={handleImmediateSearch}
              allowClear
            />
            <Button 
              type={isMyTasksActive ? "primary" : "default"}
              icon={<UserOutlined />}
              onClick={toggleMyTasks}
              className={classNames({[style.myTasksActive]: isMyTasksActive})}
            >
              My Tasks
            </Button>
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
            rowKey="id"
          />
        }
        {viewMode === 'calendar' &&
          <CalendarView 
            dataSource={dataSource?.data || []} 
            currentDate={currentDate}
            showEventDetail={(task: any) => {
              setSelectedTask(task)
              showDetailModal(true)
            }}
            addTask={(defaultValues: any) => {
              setTaskDefaultVals(defaultValues)
              showNewTask(true)
            }}
          />
        }
        {viewMode === 'progress' &&
          <KanbanView 
            dataSource={kanbanDataSource} 
            addTask={openNewTask} 
            onTaskStatusChange={handleTaskStatusChange}
            showEventDetail={(task: any) => {
              setSelectedTask(task)
              showDetailModal(true)
            }}
          />
        }
      </div>
      {isOpenFilter && <Filter isOpen={isOpenFilter} showOpen={showFilter} />}
      {isShowNewTask && <NewTask isOpen={isShowNewTask} showOpen={showNewTask} onRefresh={refreshTask} defaultValues={taskDefaultVals} />}
      {isShowDetailModal && <DetailModal isShowModal={isShowDetailModal} onClose={onCloseDetailModal} task={selectedTask} openEdit={openEditTask} onDelete={handleDeleteTask} openEventDetail={openEventDetailModal} />}
      {isShowEditTask && <EditTask task={selectedTask} isOpen={isShowEditTask} showOpen={showEditTask} onRefresh={refreshTask} />}
      {isShowEventDetail && <EventDetailModal isShowModal={isShowEventDetail} onClose={onCloseEventDetailModal} event={selectedEvent} />}
    </>
  )
}

export default Tasks