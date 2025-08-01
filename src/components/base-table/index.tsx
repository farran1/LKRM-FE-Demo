import convertSearchParams from '@/utils/app'
import { Table } from 'antd'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { stringify } from 'querystring'
import { memo } from 'react'

function BaseTable({
  loading,
  columns,
  dataSource,
  rowKey,
  ...props
}: any) {
  const searchParams = useSearchParams()
  const queryParams = convertSearchParams(searchParams)
  // const [form] = Form.useForm()
  const router = useRouter()
  const pathname = usePathname()

  const onChangePage = (page: number, perPage: number) => {
    queryParams.page = page.toString()
    router.push(`${pathname}?${stringify(queryParams)}`)
  }

  const reset = () => {
    router.push(pathname)
  }

  return (
    <Table
      {...props}
      loading={loading}
      scroll={{ x: 'max-content' }}
      columns={Array.isArray(columns) ? columns : []}
      pagination={{
        onChange: onChangePage,
        total: dataSource?.meta?.total,
        current: dataSource?.meta?.page,
        pageSize: dataSource?.meta?.perPage,
        position: ['bottomCenter']
      }}
      dataSource={dataSource?.data}
      rowKey={rowKey || "id"}
      locale={{ emptyText: 'No Data' }}
      // onChange={onTableChange}
    />
  )
}

export default memo(BaseTable)