'use client'

import BaseTable from '@/components/base-table'
import style from './style.module.scss'
import { App, Button, Flex, Input } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import PlusIcon from '@/components/icon/plus.svg'
import SortIcon from '@/components/icon/sort.svg'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import convertSearchParams from '@/utils/app'
import { stringify } from 'querystring'
import useSWR from 'swr'
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons'
import SearchIcon from '@/components/icon/search.svg'
import { Tag } from 'antd'
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch'
import ColumnEditor from './components/column-editor'

function Expense() {
  const searchParams = useSearchParams()
  const queryParams = convertSearchParams(searchParams)
  const API_KEY = `/api/expenses?${stringify(queryParams)}`
  const {data: dataSource, isLoading, isValidating, mutate} = useSWR(API_KEY, null, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 30000, // 30 seconds
    errorRetryCount: 2,
    errorRetryInterval: 5000,
    keepPreviousData: true
  })
  const { notification } = App.useApp()
  const [loadingSearch, setLoadingSearch] = useState(false)
  const router = useRouter()
  const [columnConfig, setColumnConfig] = useState([
    { key: 'date', title: 'Date', visible: true, sortable: true },
    { key: 'merchant', title: 'Merchant', visible: true, sortable: true },
    { key: 'amount', title: 'Amount', visible: true, sortable: true },
    { key: 'bucket', title: 'Bucket', visible: true, sortable: false },
    { key: 'event', title: 'Event', visible: true, sortable: false },
    { key: 'receipt', title: 'Receipt', visible: true, sortable: false },
    { key: 'description', title: 'Description', visible: true, sortable: false },
  ])

  // Debounced search functionality
  const handleDebouncedSearch = useCallback((searchTerm: string) => {
    const currentParams = convertSearchParams(searchParams);
    if (searchTerm.trim()) {
      currentParams.description = searchTerm
      currentParams.merchant = searchTerm
    } else {
      delete currentParams.description
      delete currentParams.merchant
    }
    const newQuery = stringify(currentParams)
    console.log('Expenses search - URL params:', { searchTerm, currentParams, newQuery })
    router.push(`?${newQuery}`)
  }, [searchParams, router])

  const {
    searchTerm: searchkey,
    setSearchTerm: setSearchKey,
    isSearching,
    handleImmediateSearch,
    clearSearch
  } = useDebouncedSearch(queryParams?.description || queryParams?.merchant || '', 500, handleDebouncedSearch);

  // Handle refresh parameter to force data reload
  useEffect(() => {
    if (queryParams?.refresh) {
      mutate() // Trigger SWR to refetch data
    }
  }, [queryParams?.refresh, mutate])

  const sort = useCallback((sortBy: string, sortDirection = 'desc') => {
    queryParams.sortBy = sortBy
    queryParams.sortDirection = sortDirection
    const newQuery = stringify(queryParams)
    router.push(`?${newQuery}`)
  }, [queryParams])

  // Normalize API response to a consistent array for the table
  const tableData = useMemo(() => {
    if (Array.isArray(dataSource)) return dataSource
    if (dataSource && Array.isArray((dataSource as any).data)) return (dataSource as any).data
    return []
  }, [dataSource])

  // Custom sorting function for client-side sorting
  const getSortedData = useMemo(() => {
    if (!tableData || tableData.length === 0 || !queryParams.sortBy) return tableData

    const { sortBy, sortDirection } = queryParams
    const isAsc = sortDirection === 'asc'

    return [...tableData].sort((a, b) => {
      let aVal, bVal

      switch (sortBy) {
        case 'date':
          aVal = new Date(a.date || a.createdAt).getTime()
          bVal = new Date(b.date || b.createdAt).getTime()
          break

        case 'amount':
          aVal = parseFloat(a.amount || 0)
          bVal = parseFloat(b.amount || 0)
          break

        case 'merchant':
          aVal = (a.merchant || '').toLowerCase()
          bVal = (b.merchant || '').toLowerCase()
          break

        case 'bucket':
          aVal = (a?.budgets?.name || '').toLowerCase()
          bVal = (b?.budgets?.name || '').toLowerCase()
          break

        case 'event':
          aVal = (a?.events?.name || '').toLowerCase()
          bVal = (b?.events?.name || '').toLowerCase()
          break

        case 'receipt':
          aVal = a?.receiptUrl ? 1 : 0
          bVal = b?.receiptUrl ? 1 : 0
          break



        default:
          return 0
      }

      // Push empty/missing values (rendered as '-') to the bottom by default
      const isEmpty = (v: any) => v === null || v === undefined ||
        (typeof v === 'number' && !Number.isFinite(v)) ||
        (typeof v === 'string' && v.trim() === '')

      const aEmpty = isEmpty(aVal)
      const bEmpty = isEmpty(bVal)
      if (aEmpty && !bEmpty) return 1
      if (!aEmpty && bEmpty) return -1
      if (aEmpty && bEmpty) return 0

      // Handle numeric vs string comparison (after empty handling)
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return isAsc ? aVal - bVal : bVal - aVal
      } else {
        // String comparison
        if (aVal < bVal) return isAsc ? -1 : 1
        if (aVal > bVal) return isAsc ? 1 : -1
        return 0
      }
    })
  }, [tableData, queryParams.sortBy, queryParams.sortDirection])

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

  // Debug: Log the data structure
  useEffect(() => {
    if (tableData && tableData.length > 0) {
      console.log('First expense data structure:', tableData[0])
    }
  }, [tableData])

  const columns = useMemo(() => {
    const columnDefinitions = {
      date: {
        title: renderHeader('Date', 'date'),
        dataIndex: 'date',
        render: (text: string, data: any) => {
          const date = data?.date || data?.createdAt
          return date ? new Date(date).toLocaleDateString() : '-'
        }
      },
      merchant: {
        title: renderHeader('Merchant', 'merchant'),
        dataIndex: 'merchant',
        render: (text: string, data: any) => {
          return data?.merchant || text || '-'
        }
      },
      amount: {
        title: renderHeader('Amount', 'amount'),
        render: (data: any) => {
          const amount = data?.amount
          if (!amount) return '-'
          return `$${parseFloat(amount).toLocaleString()}`
        }
      },
      bucket: {
        title: renderHeader('Bucket', 'bucket'),
        render: (data: any) => {
          console.log('Budget data:', data?.budgets)
          const budgetName = data?.budgets?.name
          if (!budgetName) return '-'
          return <Tag color="purple">{budgetName}</Tag>
        }
      },
      event: {
        title: renderHeader('Event', 'event'),
        render: (data: any) => {
          console.log('Event data:', data?.events)
          const eventName = data?.events?.name
          const eventId = data?.events?.id
          if (!eventName || !eventId) return '-'
          return (
            <span 
              style={{ 
                color: '#1D75D0', 
                textDecoration: 'underline',
                fontSize: '14px',
                cursor: 'pointer'
              }}
              onClick={() => {
                // Events use popup modals, not separate pages
                console.log('Event navigation disabled - events use popup modals')
              }}
            >
              {eventName}
            </span>
          )
        }
      },
      receipt: {
        title: renderHeader('Receipt', 'receipt'),
        render: (data: any) => {
          const hasReceipt = data?.receiptUrl
          return hasReceipt ? 
            <Tag color="green">Yes</Tag> : 
            <Tag color="red">No</Tag>
        }
      },
      description: {
        title: 'Description',
        render: (data: any) => {
          const description = data?.description
          if (!description) return '-'
          // Truncate long descriptions
          return description.length > 50 ? 
            `${description.substring(0, 50)}...` : 
            description
        }
      }
    }

    return columnConfig
      .filter(col => col.visible)
      .map(col => columnDefinitions[col.key as keyof typeof columnDefinitions])
  }, [queryParams.sortBy, queryParams.sortDirection, columnConfig])

  const openNewExpense = () => {
    router.push('/expenses/create')
  }

  const resetToDefaultView = () => {
    // Reset to default view with no filters
    router.push('/expenses')
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

  const onRow = useCallback((record: any) => ({
    onClick: () => {
      router.push('/expenses/' + record.id)
    },
    style: { cursor: 'pointer' },
  }), [])

  return (
    <>
      <div className={style.container}>
        <Flex justify="space-between" align="center" style={{ marginBottom: 10 }}>
          <Flex align='flex-end' gap={16}>
            <div className={style.title} onClick={resetToDefaultView} style={{ cursor: 'pointer' }}>Expenses</div>
          </Flex>
          <Flex gap={10}>
            <Input
              prefix={<SearchIcon />}
              placeholder="Search expenses..."
              className={style.search}
              value={searchkey}
              onChange={(e) => setSearchKey(e.target.value)}
              onPressEnter={handleImmediateSearch}
              allowClear
            />
            <ColumnEditor 
              columns={columnConfig}
              onColumnsChange={handleColumnsChange}
              onReorder={handleColumnReorder}
            />
            <Button icon={<PlusIcon />} onClick={openNewExpense}>Add New Expense</Button>
          </Flex>
        </Flex>
        
        {isLoading ? (
          <div style={{ padding: '20px' }}>
            <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div>Loading expenses...</div>
            </div>
          </div>
        ) : (
          <BaseTable
            bordered
            dataSource={getSortedData}
            columns={columns}
            loading={isValidating}
            onRow={onRow}
          />
        )}
      </div>
    </>
  )
}

export default Expense
