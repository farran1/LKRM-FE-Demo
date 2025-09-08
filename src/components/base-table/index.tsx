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

  // Handle both array and object dataSource formats
  const tableData = Array.isArray(dataSource) ? dataSource : dataSource?.data || []
  const meta = dataSource?.meta || { total: tableData.length, page: 1, perPage: 20 }

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
        total: meta.total,
        current: meta.page,
        pageSize: meta.perPage,
        position: ['bottomCenter']
      }}
      dataSource={tableData}
      rowKey={rowKey || "id"}
      locale={{ emptyText: 'No Data' }}
      // onChange={onTableChange}
    />
  )
}

export default memo(BaseTable)