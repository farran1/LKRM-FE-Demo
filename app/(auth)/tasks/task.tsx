'use client'

import BaseTable from '@/components/base-table'
import style from './style.module.scss'
import { App, Button, Flex, Input, Segmented } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import CalendarIcon from '@/components/icon/calendar_view.svg'
import ListIcon from '@/components/icon/list_view.svg'
import ChartIcon from '@/components/icon/chart-bar.svg'
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
import TaskMentionInput from '../dashboard3/components/TaskMentionInput'

function Tasks() {
  const searchParams = useSearchParams()
  const queryParams = convertSearchParams(searchParams)
  const API_KEY = `/api/tasks?${stringify(queryParams)}`
  const {data: response, isLoading, isValidating, mutate} = useSWR(API_KEY)
  
  // Extract tasks from the API response
  const dataSource = response?.tasks || []
  
  // Transform data for Kanban view
  const kanbanDataSource = useMemo(() => {
    if (!dataSource || dataSource.length === 0) {
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
    
    dataSource.forEach((task: any) => {
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
    console.log('Extracted tasks:', dataSource)
    console.log('Tasks count:', dataSource?.length || 0)
    console.log('Kanban data source:', kanbanDataSource)
  }, [response, dataSource, kanbanDataSource])
  
  const [isOpenFilter, showFilter] = useState(false)
  const [isShowNewTask, showNewTask] = useState(false)
  const [isShowMentionTask, setIsShowMentionTask] = useState(false)
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(dayjs())
  const [isSort, enableSort] = useState(false)
  const [taskDefaultVals, setTaskDefaultVals] = useState({})
  const [searchkey, setSearchKey] = useState('')
  const [isShowDetailModal, showDetailModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [isShowEditTask, showEditTask] = useState(false)

  useEffect(() => {
    setSearchKey(queryParams?.name)
  }, [queryParams?.name])

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
      queryParams.dueDate || queryParams.playerIds || queryParams.priority
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
      title: 'Assignee',
      render: (data: any) => {
        if (!data.users || !data.users.username) return 'Unknown user'
        return `👤 ${data.users.username}`
      }
    },
    {
      title: 'Event',
      render: (data: any) => {
        if (!data.events || !data.events.name) return 'No event'
        return data.events.name
      }
    },
    {
      title: 'Description',
      render: (data: any) => {
        return data.description || 'No description'
      }
    },
    {
      title: renderHeader('Priority Level', 'priority'),
      render: (data: any) => {
        if (!data.task_priorities || !data.task_priorities.name) {
          return <span className={classNames(style.priority, style['no-priority'])}>No priority</span>
        }
        return <span className={classNames(style.priority, style[data.task_priorities.name.toLowerCase()])}>{data.task_priorities.name}</span>
      }
    },
    {
      title: renderHeader('Due Date', 'dueDate'),
      render: (data: any) => {
        if (!data.dueDate) return 'No due date'
        return moment(data.dueDate).format('MMMM D, YYYY')
      }
    },
  ], [queryParams.sortBy, queryParams.sortDirection, isSort])

  const refreshTask = () => {
    mutate()
  }

  const openFilter = () => {
    showFilter(true)
  }

  const handleSearch = () => {
    queryParams.name = searchkey
    const newQuery = stringify(queryParams)
    router.push(`?${newQuery}`)
  }

  const onChangeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKey(e.target.value)
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

    enableSort(false)
  }, [queryParams, viewMode])

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

  const openNewTask = (defaultValues = {}) => {
    showNewTask(true)
    setTaskDefaultVals(defaultValues)
  }

  const onCloseDetailModal = () => {
    showDetailModal(false)
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

  // Handle task status change from Kanban drag and drop
  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
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
            <div className={style.title}>Tasks</div>
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
              onChange={onChangeSearch}
              onPressEnter={handleSearch}
              allowClear
            />
            {(viewMode === 'calendar' || viewMode === 'progress') &&
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
            dataSource={dataSource} 
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
      {isShowDetailModal && <DetailModal isShowModal={isShowDetailModal} onClose={onCloseDetailModal} task={selectedTask} openEdit={openEditTask} />}
      {isShowEditTask && <EditTask task={selectedTask} isOpen={isShowEditTask} showOpen={showEditTask} onRefresh={refreshTask} />}
    </>
  )
}

export default Tasks