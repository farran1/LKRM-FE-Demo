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

function Player() {
  const searchParams = useSearchParams()
  const queryParams = convertSearchParams(searchParams)
  const API_KEY = `/api/players?${stringify(queryParams)}`
  const {data: dataSource, isLoading, isValidating, mutate} = useSWR(API_KEY)
  const { notification } = App.useApp()
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [searchkey, setSearchKey] = useState('')
  const router = useRouter()


  useEffect(() => {
    setSearchKey(queryParams?.name)
  }, [queryParams?.name])

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
          // Alphabetical sorting by last name, then first name
          aVal = (a.first_name && a.last_name) 
            ? `${a.last_name}, ${a.first_name}`.toLowerCase()
            : (a.name || '').toLowerCase()
          bVal = (b.first_name && b.last_name) 
            ? `${b.last_name}, ${b.first_name}`.toLowerCase()
            : (b.name || '').toLowerCase()
          break

        case 'jersey':
          // Numeric sorting for jersey numbers
          aVal = parseInt(a.jersey_number || a.jersey || '0')
          bVal = parseInt(b.jersey_number || b.jersey || '0')
          break

        case 'position':
          // Alphabetical sorting for positions
          aVal = (a.position?.name || '').toLowerCase()
          bVal = (b.position?.name || '').toLowerCase()
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



  const columns = useMemo(() => [
    {
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
    {
      title: renderHeader('Jersey #', 'jersey'),
      render: (data: any) => {
        // Use jersey_number if available, otherwise fall back to jersey
        return data?.jersey_number || data?.jersey || '-'
      }
    },
    {
      title: renderHeader('Position', 'position'),
      render: (data: any) => {
        return data?.position?.name || '-'
      }
    },
    {
      title: renderHeader('School Year', 'school_year'),
      render: (data: any) => {
        // Capitalize first letter of school year
        const schoolYear = data?.school_year
        return schoolYear ? schoolYear.charAt(0).toUpperCase() + schoolYear.slice(1) : '-'
      }
    },
    {
      title: 'Notes',
      render: (data: any) => {
        // Show actual note content separated by pipes
        const notes = data?.notes || []
        if (notes.length === 0) return '-'
        
        const noteTexts = notes.map((note: any) => note.note || note.note_text || 'No content')
        return noteTexts.join(' | ')
      }
    },
    {
      title: 'Goals',
      render: (data: any) => {
        // Show actual goal content separated by pipes
        const goals = data?.goals || []
        if (goals.length === 0) return '-'
        
        const goalTexts = goals.map((goal: any) => goal.goal || goal.goal_text || 'No content')
        return goalTexts.join(' | ')
      }
    },
  ], [queryParams.sortBy, queryParams.sortDirection])

  const openNewPlayer = () => {
    router.push('/players/create')
  }

  const openBulkUpload = () => {
    router.push('/players/import')
  }

  const handleSearch = async () => {
    queryParams.name = searchkey
    const newQuery = stringify(queryParams)
    router.push(`?${newQuery}`)
  }

  const onChangeSearch = (e: any) => {
    setSearchKey(e.target.value)
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
            <div className={style.title}>Players</div>
          </Flex>
          <Flex gap={10}>
            <Input
              prefix={<SearchIcon />}
              placeholder="Search"
              className={style.search}
              value={searchkey}
              onChange={onChangeSearch}
              onPressEnter={handleSearch}
              allowClear
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