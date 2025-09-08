'use client'

import { Button, Col, DatePicker, Form, Input, Row, Select, Typography, Flex, Skeleton, Upload } from 'antd'
import type { UploadFile as AntUploadFile, RcFile } from 'antd/es/upload/interface'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { App } from 'antd'
import ArrowIcon from '@/components/icon/arrow_left.svg'
import style from '../../style.module.scss'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'
import { UploadOutlined, FileTextOutlined } from '@ant-design/icons'
import { secureStorage, normalizeReceiptPath } from '@/lib/security/storage'
import { UserRole } from '@/lib/security/roles'
import { auditLogger, AuditAction } from '@/lib/security/audit'

const { Title } = Typography



interface Expense {
  id: number
  budgetId: number | null
  merchant: string
  amount: number

  date: string
  eventId: number | null
  description: string
  receiptUrl: string | null
  budgets?: { name: string }
  events?: { name: string }
}

function EditExpense({ expenseId }: { expenseId: string }) {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [budgets, setBudgets] = useState<Array<{ id: number; name: string }>>([])
  const [events, setEvents] = useState<Array<{ id: number; name: string }>>([])
  const [expense, setExpense] = useState<Expense | null>(null)
  type ExpenseUploadFile = AntUploadFile & { filePath?: string }
  const [fileList, setFileList] = useState<ExpenseUploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [form] = Form.useForm()
  const router = useRouter()
  const { message } = App.useApp()

  useEffect(() => {
    if (expenseId) {
      fetchExpense()
      fetchBudgets()
      fetchEvents()
    }
  }, [expenseId])

  // Set form values after expense is loaded
  useEffect(() => {
    if (expense && form) {
      form.setFieldsValue({
        date: dayjs(expense.date),
        amount: expense.amount,
        merchant: expense.merchant,
        budgetId: expense.budgetId,
        eventId: expense.eventId,
        receiptUrl: expense.receiptUrl,
        description: expense.description
      })
    }
  }, [expense, form])

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      // Cleanup any pending operations
    }
  }, [])

  const fetchExpense = async () => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}`)
      if (response.ok) {
        const expenseData = await response.json()
        setExpense(expenseData)

        // Set file list if receipt exists
        if (expenseData.receiptUrl) {
          setFileList([{
            uid: '-1',
            name: 'Current Receipt',
            status: 'done',
            url: expenseData.receiptUrl,
            // Store the file path for private storage
            filePath: expenseData.receiptUrl,
          }])
        }
      }
    } catch (error) {
      console.error('Error fetching expense:', error)
      message.error('Failed to fetch expense')
    } finally {
      setFetching(false)
    }
  }

  const fetchBudgets = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('budgets')
        .select('id, name')
        .order('name')
      
      if (error) throw error
      setBudgets(data || [])
    } catch (error) {
      console.error('Error fetching budgets:', error)
    }
  }

  const fetchEvents = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('events')
        .select('id, name')
        .order('name')
      
      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const goBack = () => {
    // Go back to expense detail page
    router.push(`/expenses/${expenseId}`)
  }

  const uploadFile = async (file: File) => {
    try {
      setUploading(true)
      
      // Use secure storage with enhanced security
      const result = await secureStorage.uploadFile(
        file,
        'current_user_id', // TODO: Get from actual user context
        UserRole.COACH,    // TODO: Get from actual user context
        'expense_edit'
      )
      
      if (!result.success) {
        message.error(result.error || 'File upload failed')
        return null
      }
      
      // Log successful upload
      await auditLogger.logUserAction(
        'current_user_id', // TODO: Get from actual user context
        'unknown',         // TODO: Get from actual user context
        UserRole.COACH,    // TODO: Get from actual user context
        AuditAction.RECEIPT_UPLOADED,
        'receipt',
        result.filePath,
        {
          originalName: file.name,
          fileSize: file.size,
          context: 'expense_edit'
        }
      )
      
      return result.filePath
    } catch (error) {
      console.error('Error uploading file:', error)
      message.error('Failed to upload file')
      return null
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (values: any) => {
    setLoading(true)
    try {
      // Handle file upload if there are new files
      let receiptUrl = expense?.receiptUrl || null
      
      // If there's a new file to upload
      if (fileList.length > 0 && fileList[0].originFileObj) {
        const uploadedUrl = await uploadFile(fileList[0].originFileObj as File)
        if (uploadedUrl) {
          receiptUrl = uploadedUrl
        }
      }
      // If there's an existing file in the list (not a new upload)
      else if (fileList.length > 0 && fileList[0].url && !fileList[0].originFileObj) {
        // Prefer stored filePath, otherwise normalize legacy URL to object path
        // @ts-ignore - custom field
        const existingPath = fileList[0].filePath as string | undefined
        receiptUrl = existingPath || normalizeReceiptPath(fileList[0].url)
      }
      
      console.log('Receipt URL being sent:', receiptUrl)
      console.log('File list:', fileList)

      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          date: values.date?.format('YYYY-MM-DD'),
          budgetId: values.budgetId || null,
          eventId: values.eventId || null,
          receiptUrl: receiptUrl
        }),
      })

      if (response.ok) {
        message.success('Expense updated successfully!')
        router.push(`/expenses/${expenseId}`)
      } else {
        const errorData = await response.json()
        message.error(errorData.error || 'Failed to update expense')
      }
    } catch (error) {
      console.error('Error updating expense:', error)
      message.error('Failed to update expense')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className={style.container}>
        <Skeleton active />
      </div>
    )
  }

  if (!expense) {
    return (
      <div className={style.container}>
        <div>Expense not found</div>
        <Button onClick={goBack}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className={style.container}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
        <Flex align='center' gap={16}>
          <ArrowIcon onClick={goBack} style={{ cursor: 'pointer' }} />
          <div className={style.title}>Edit Expense</div>
        </Flex>
      </Flex>

      <Form
        layout="vertical"
        onFinish={onSubmit}
        form={form}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="date"
              label="Expense Date"
              rules={[{ required: true, message: 'Please select the expense date' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="amount"
              label="Amount"
              rules={[{ required: true, message: 'Please enter the amount' }]}
            >
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                prefix="$"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="merchant"
              label="Merchant/Store"
              rules={[{ required: true, message: 'Please enter the merchant name' }]}
            >
              <Input placeholder="Enter merchant name" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="receiptUrl"
              label="Receipt (Optional)"
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Upload
                  fileList={fileList}
                  onChange={({ fileList: newFileList }) => setFileList(newFileList)}
                  beforeUpload={() => false} // Prevent auto upload
                  maxCount={1}
                  accept=".pdf,.jpg,.jpeg,.png,.gif"
                  listType="picture"
                >
                  <Button 
                    icon={<UploadOutlined />} 
                    loading={uploading}
                    disabled={uploading}
                  >
                    Upload Receipt
                  </Button>
                </Upload>
                <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.2', flexShrink: 0 }}>
                  <div>Supported formats:</div>
                  <div>PDF, JPG, PNG, GIF (Max 10MB)</div>
                </div>
              </div>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="budgetId"
              label="Budget (Optional)"
            >
              <Select placeholder="Select budget" allowClear>
                {budgets.map(budget => (
                  <Select.Option key={budget.id} value={budget.id}>
                    {budget.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="eventId"
              label="Event (Optional)"
            >
              <Select placeholder="Select event" allowClear>
                {events.map(event => (
                  <Select.Option key={event.id} value={event.id}>
                    {event.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>



        <Form.Item
          name="description"
          label="Description (Optional)"
        >
          <Input.TextArea
            rows={3}
            placeholder="Describe what this expense was for..."
          />
        </Form.Item>

        <Form.Item style={{ marginTop: 24 }}>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Update Expense
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default EditExpense
