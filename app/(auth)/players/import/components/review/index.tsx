'use client'

import BaseTable from '@/components/base-table'
import api from '@/services/api'
import { memo, useEffect, useMemo, useState } from 'react'
import ProfileIcon from '@/components/icon/profile.svg'
import { Tooltip } from 'antd'
import style from './style.module.scss'
import classNames from 'classnames'

const ReviewPage = (props: any) => {
  const { importId } = props
  const [dataSource, setDataSource] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    validate()
  }, [importId])

  const validate = async() => {
    setLoading(true)
    const payload = { importId }
    const res = await api.post('/api/players/validate-import', payload)
    setDataSource(res.data)
    setLoading(false)
  }

  const renderCell = (data: any) => {
    return (
      <Tooltip title={data.error} color={data.error ? 'pink' : 'orange'}>
        <div className={classNames(style.cell, data.error ? 'cellError' : '')}>{data.value ||  <span>&nbsp;</span>}</div>
      </Tooltip>
    )
  }

  const columns = useMemo(() => [
    {
      title: 'Image',
      render: (data: any) => {
        return <div className={style.cell}><ProfileIcon /></div>
      }
    },
    {
      title: 'Name',
      dataIndex: 'name',
      render: renderCell
    },
    {
      title: 'Position',
      dataIndex: 'position',
      render: renderCell
    },
    {
      title: 'Jersey #',
      dataIndex: 'jersey',
      render: renderCell
    },
    {
      title: 'Phone Number',
      dataIndex: 'phoneNumber',
      render: renderCell
    },
    {
      title: 'Height',
      dataIndex: 'height',
      render: renderCell
    },
  ], [])

  return (
    <div className={style.container}>
      <BaseTable
        bordered
        dataSource={dataSource}
        columns={columns}
        loading={loading}
      />
    </div>
  )
}

export default memo(ReviewPage)