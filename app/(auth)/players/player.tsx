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
import FunnelIcon from '@/components/icon/funnel.svg'
import classNames from 'classnames'
import Filter from './components/filter'

function Player() {
  const searchParams = useSearchParams()
  const queryParams = convertSearchParams(searchParams)
  const API_KEY = `/api/players?${stringify(queryParams)}`
  const {data: dataSource, isLoading, isValidating, mutate} = useSWR(API_KEY)
  const { notification } = App.useApp()
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [searchkey, setSearchKey] = useState('')
  const router = useRouter()
  const [isOpenFilter, showFilter] = useState(false)

  useEffect(() => {
    setSearchKey(queryParams?.name)
  }, [queryParams?.name])

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

  const hasFilter = useMemo(() => {
    if (
      queryParams.positionIds || queryParams.jersey || queryParams.fromHeight || queryParams.toHeight || queryParams.fromWeight || queryParams.toWeight
    ) return true
    return false
  }, [searchParams.size])

  const columns = useMemo(() => [
    {
      title: 'Image',
      render: (data: any) => {
        return data?.avatar ? <img src={data.avatar} width={24} height={24} className={style.avatar} /> : <ProfileIcon />
      }
    },
    {
      title: renderHeader('Name', 'name'),
      dataIndex: 'name',
    },
    {
      title: renderHeader('Position', 'position'),
      render: (data: any) => {
        return data?.position?.name
      }
    },
    {
      title: renderHeader('Jersey #', 'jersey'),
      dataIndex: 'jersey',
    },
    {
      title: renderHeader('Height', 'height'),
      render: (data: any) => {
        return data?.height ? data?.height + '"' : ''
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

  const openFilter = () => {
    showFilter(true)
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
            <Button type="primary" className={classNames({[style.filter]: !hasFilter})} icon={<FunnelIcon />} onClick={openFilter}>Filters</Button>
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
            <Button type="primary" icon={<UploadIcon />} onClick={openBulkUpload}>Bulk Upload</Button>
          </Flex>
        </Flex>
        
        <BaseTable
          bordered
          dataSource={dataSource}
          columns={columns}
          loading={isLoading || isValidating}
          onRow={onRow}
        />
      </div>
      <Filter isOpen={isOpenFilter} showOpen={showFilter} />
    </>
  )
}

export default Player