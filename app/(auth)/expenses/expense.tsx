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
import SearchIcon from '@/components/icon/search.svg'
import { Tag } from 'antd'

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
  const [searchkey, setSearchKey] = useState('')
  const router = useRouter()

  useEffect(() => {
    setSearchKey(queryParams?.description || queryParams?.merchant)
  }, [queryParams?.description, queryParams?.merchant])

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

  // Debug: Log the data structure
  useEffect(() => {
    if (dataSource && dataSource.length > 0) {
      console.log('First expense data structure:', dataSource[0])
    }
  }, [dataSource])

  const columns = useMemo(() => [
    {
      title: renderHeader('Date', 'date'),
      dataIndex: 'date',
      render: (text: string, data: any) => {
        const date = data?.date || data?.createdAt
        return date ? new Date(date).toLocaleDateString() : '-'
      }
    },
    {
      title: renderHeader('Merchant', 'merchant'),
      dataIndex: 'merchant',
      render: (text: string, data: any) => {
        return data?.merchant || text || '-'
      }
    },

    {
      title: renderHeader('Amount', 'amount'),
      render: (data: any) => {
        const amount = data?.amount
        if (!amount) return '-'
        return `$${parseFloat(amount).toLocaleString()}`
      }
    },
    {
      title: 'Budget',
      render: (data: any) => {
        console.log('Budget data:', data?.budgets)
        const budgetName = data?.budgets?.name
        if (!budgetName) return '-'
        return <Tag color="purple">{budgetName}</Tag>
      }
    },
    {
      title: 'Event',
      render: (data: any) => {
        console.log('Event data:', data?.events)
        const eventName = data?.events?.name
        if (!eventName) return '-'
        return <Tag color="orange">{eventName}</Tag>
      }
    },
    {
      title: 'Receipt',
      render: (data: any) => {
        const hasReceipt = data?.receiptUrl
        return hasReceipt ? 
          <Tag color="green">Yes</Tag> : 
          <Tag color="red">No</Tag>
      }
    },
    {
      title: 'Description',
      render: (data: any) => {
        const description = data?.description
        if (!description) return '-'
        // Truncate long descriptions
        return description.length > 50 ? 
          `${description.substring(0, 50)}...` : 
          description
      }
    },
  ], [queryParams.sortBy, queryParams.sortDirection])

  const openNewExpense = () => {
    router.push('/expenses/create')
  }

  const handleSearch = async () => {
    queryParams.description = searchkey
    queryParams.merchant = searchkey
    const newQuery = stringify(queryParams)
    router.push(`?${newQuery}`)
  }

  const onChangeSearch = (e: any) => {
    setSearchKey(e.target.value)
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
            <div className={style.title}>Expenses</div>
          </Flex>
          <Flex gap={10}>
            <Input
              prefix={<SearchIcon />}
              placeholder="Search expenses..."
              className={style.search}
              value={searchkey}
              onChange={onChangeSearch}
              onPressEnter={handleSearch}
              allowClear
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
