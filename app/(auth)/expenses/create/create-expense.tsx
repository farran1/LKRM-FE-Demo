'use client'

import { Button, Col, DatePicker, Form, Input, Row, Select, Switch, Typography, Flex, Upload } from 'antd'
import type { UploadFile as AntUploadFile } from 'antd/es/upload/interface'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { App } from 'antd'
import ArrowIcon from '@/components/icon/arrow_left.svg'
import style from '../style.module.scss'
import { supabase } from '@/lib/supabase'
import { UploadOutlined } from '@ant-design/icons'
import { secureStorage } from '@/lib/security/storage'
import { UserRole } from '@/lib/security/roles'

const { Title } = Typography



function CreateExpense() {
  const [loading, setLoading] = useState(false)
  const [budgets, setBudgets] = useState<Array<{ id: number; name: string }>>([])
  const [events, setEvents] = useState<Array<{ id: number; name: string }>>([])
  type ExpenseUploadFile = AntUploadFile & { filePath?: string }
  const [fileList, setFileList] = useState<ExpenseUploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [form] = Form.useForm()
  const router = useRouter()
  const { message } = App.useApp()

  useEffect(() => {
    fetchBudgets()
    fetchEvents()
  }, [])

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
    router.back()
  }

  const uploadFile = async (file: File) => {
    try {
      setUploading(true)
      // Use secure storage
      const result = await secureStorage.uploadFile(
        file,
        'current_user_id', // TODO use real session
        UserRole.COACH,    // TODO use real role
        'expense_create'
      )
      if (!result.success) {
        message.error(result.error || 'Failed to upload file')
        return null
      }
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
      // Handle file upload if there are files
      let receiptUrl = null
      if (fileList.length > 0 && fileList[0].originFileObj) {
        const uploadedUrl = await uploadFile(fileList[0].originFileObj as File)
        if (uploadedUrl) {
          receiptUrl = uploadedUrl
        }
      }

      const response = await fetch('/api/expenses', {
        method: 'POST',
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
        message.success('Expense created successfully!')
        router.push('/expenses')
      } else {
        const errorData = await response.json()
        message.error(errorData.error || 'Failed to create expense')
      }
    } catch (error) {
      console.error('Error creating expense:', error)
      message.error('Failed to create expense')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={style.container}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
        <Flex align='center' gap={16}>
          <ArrowIcon onClick={goBack} style={{ cursor: 'pointer' }} />
          <div className={style.title}>Create New Expense</div>
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
            Create Expense
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default CreateExpense
