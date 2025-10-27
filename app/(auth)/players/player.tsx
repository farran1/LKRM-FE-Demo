'use client'

import BaseTable from '@/components/base-table'
import style from './style.module.scss'
import { App, Button, Flex, Input } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import PlusIcon from '@/components/icon/plus.svg'
import SortIcon from '@/components/icon/sort.svg'
import { useRouter, useSearchParams } from 'next/navigation'
import convertSearchParams from '@/utils/app'
import { stringify } from 'querystring'
import useSWR from 'swr'
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import ProfileIcon from '@/components/icon/profile.svg'
import UploadIcon from '@/components/icon/arrow-up-tray.svg'
import SearchIcon from '@/components/icon/search.svg'
import classNames from 'classnames'
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch'
import ColumnEditor from './components/column-editor'

function Player() {
  const searchParams = useSearchParams()
  const queryParams = convertSearchParams(searchParams)
  const ensureActive = { ...queryParams }
  // Always hide archived players
  ensureActive.isActive = 'true'
  const API_KEY = `/api/players?${stringify(ensureActive)}`
  const {data: response, isLoading, isValidating, mutate} = useSWR(API_KEY)
  const dataSource = response?.data || []
  const { notification } = App.useApp()
  const [loadingSearch, setLoadingSearch] = useState(false)
  const router = useRouter()
  const [columnConfig, setColumnConfig] = useState([
    { key: 'name', title: 'Name', visible: true, sortable: true },
    { key: 'jersey', title: 'Jersey #', visible: true, sortable: true },
    { key: 'position', title: 'Position', visible: true, sortable: true },
    { key: 'school_year', title: 'School Year', visible: true, sortable: true },
    { key: 'notes', title: 'Notes', visible: true, sortable: false },
    { key: 'goals', title: 'Goals', visible: true, sortable: false },
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

  const sort = useCallback((sortBy: string, sortDirection = 'desc') => {
    queryParams.sortBy = sortBy
    queryParams.sortDirection = sortDirection
    const newQuery = stringify(queryParams)
    router.push(`?${newQuery}`)
  }, [queryParams])

  // Custom sorting function for client-side sorting
  const getSortedData = useMemo(() => {
    if (!dataSource || !queryParams.sortBy) return dataSource

    const { sortBy, sortDirection } = queryParams
    const isAsc = sortDirection === 'asc'

    return [...dataSource].sort((a, b) => {
      let aVal, bVal

      switch (sortBy) {
        case 'name':
          // Alphabetical sorting by first name
          aVal = (a.first_name || a.name || '').toLowerCase()
          bVal = (b.first_name || b.name || '').toLowerCase()
          break

        case 'jersey':
          // Numeric sorting for jersey numbers
          aVal = parseInt(a.jersey_number || a.jersey || '0')
          bVal = parseInt(b.jersey_number || b.jersey || '0')
          break

        case 'position':
          // Alphabetical sorting for positions
          aVal = (a.positions?.name || '').toLowerCase()
          bVal = (b.positions?.name || '').toLowerCase()
          break

        case 'school_year':
          // Grade order: freshman, sophomore, junior, senior
          const gradeOrder: Record<string, number> = { freshman: 1, sophomore: 2, junior: 3, senior: 4 }
          aVal = gradeOrder[(a.school_year || '').toLowerCase()] || 0
          bVal = gradeOrder[(b.school_year || '').toLowerCase()] || 0
          break

        default:
          return 0
      }

      // Handle numeric vs string comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return isAsc ? aVal - bVal : bVal - aVal
      } else {
        // String comparison
        if (aVal < bVal) return isAsc ? -1 : 1
        if (aVal > bVal) return isAsc ? 1 : -1
        return 0
      }
    })
  }, [dataSource, queryParams.sortBy, queryParams.sortDirection])

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
        title: renderHeader('Name', 'name'),
        dataIndex: 'name',
        render: (text: string, data: any) => {
          // Use first_name and last_name if available, otherwise fall back to name
          const fullName = data?.first_name && data?.last_name 
            ? `${data.first_name} ${data.last_name}` 
            : (data?.name || text || 'Unknown Player')
          return fullName
        }
      },
      jersey: {
        title: renderHeader('#', 'jersey'),
        render: (data: any) => {
          // Use jersey_number if available, otherwise fall back to jersey
          return data?.jersey_number || data?.jersey || '-'
        }
      },
      position: {
        title: renderHeader('Position', 'position'),
        render: (data: any) => {
          return data?.positions?.name || '-'
        }
      },
      school_year: {
        title: renderHeader('School Year', 'school_year'),
        render: (data: any) => {
          // Capitalize first letter of school year
          const schoolYear = data?.school_year
          return schoolYear ? schoolYear.charAt(0).toUpperCase() + schoolYear.slice(1) : '-'
        }
      },
      notes: {
        title: 'Notes',
        render: (data: any) => {
          // Show actual note content separated by pipes
          const notes = data?.notes || []
          if (notes.length === 0) return '-'
          
          const noteTexts = notes.map((note: any) => note.note || note.note_text || 'No content')
          const fullText = noteTexts.join(' | ')
          
          // Truncate to 100 characters and add ellipses if longer
          if (fullText.length > 35) {
            return fullText.substring(0, 35) + '...'
          }
          return fullText
        }
      },
      goals: {
        title: 'Goals',
        render: (data: any) => {
          // Show actual goal content separated by pipes
          const goals = data?.goals || []
          if (goals.length === 0) return '-'
          
          const goalTexts = goals.map((goal: any) => goal.goal || goal.goal_text || 'No content')
          const fullText = goalTexts.join(' | ')
          
          // Truncate to 100 characters and add ellipses if longer
          if (fullText.length > 35) {
            return fullText.substring(0, 35) + '...'
          }
          return fullText
        }
      }
    }

    return columnConfig
      .filter(col => col.visible)
      .map(col => columnDefinitions[col.key as keyof typeof columnDefinitions])
  }, [queryParams.sortBy, queryParams.sortDirection, columnConfig])

  const openNewPlayer = () => {
    router.push('/players/create')
  }

  const openBulkUpload = () => {
    router.push('/players/import')
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



  const resetToDefaultView = () => {
    // Reset to default view with no filters
    router.push('/players')
  }

  const onRow = useCallback((record: any) => ({
    onClick: () => {
      router.push('/players/' + record.id)
    },
    style: { cursor: 'pointer' }, // optional styling
  }), [])

  return (
    <>
      <div className={style.container}>
        <Flex justify="space-between" align="center" style={{ marginBottom: 10 }}>
          <Flex align='flex-end' gap={16}>
            <div className={style.title} onClick={resetToDefaultView} style={{ cursor: 'pointer' }}>Players</div>
          </Flex>
          <Flex gap={10}>
            <Input
              prefix={<SearchIcon />}
              placeholder="Search"
              className={style.search}
              value={searchkey}
              onChange={(e) => setSearchKey(e.target.value as string)}
              onPressEnter={handleImmediateSearch}
              allowClear
            />
            <ColumnEditor 
              columns={columnConfig}
              onColumnsChange={handleColumnsChange}
              onReorder={handleColumnReorder}
            />
            <Button icon={<PlusIcon />} onClick={openNewPlayer}>Add New Player</Button>
            {/*
              Temporarily disabled Bulk Upload:
              We plan to bring bulk player import back after updating it to the new V1 logic
              and aligning the fields (first/last name, jersey_number, position, school_year, notes, goals, etc.).
              The current importer targets an older schema and workflows, so we're hiding it for now
              to avoid confusion. Once V1 import is finalized, re-enable the button below.

              <Button type="primary" icon={<UploadIcon />} onClick={openBulkUpload}>Bulk Upload</Button>
            */}
          </Flex>
        </Flex>
        
        <BaseTable
          bordered
          dataSource={getSortedData}
          columns={columns}
          loading={isLoading || isValidating}
          onRow={onRow}
        />
      </div>
    </>
  )
}

export default Player