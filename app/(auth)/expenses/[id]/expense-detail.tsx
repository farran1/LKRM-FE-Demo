'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Descriptions, Button, Flex, Tag, Skeleton } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import ArrowIcon from '@/components/icon/arrow_left.svg'
import EditIcon from '@/components/icon/edit.svg'
import style from '../style.module.scss'
import { supabase } from '@/lib/supabase'
import { secureStorage } from '@/lib/security/storage'
import { UserRole } from '@/lib/security/roles'
import { auditLogger, AuditAction } from '@/lib/security/audit'

// Receipt display component for private storage
function ReceiptDisplay({ filePath }: { filePath: string }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const generateUrl = async () => {
      try {
        // Use secure storage for file access
        const result = await secureStorage.getSecureFileAccess(
          filePath,
          'current_user_id', // TODO: Get from actual user context
          UserRole.COACH,    // TODO: Get from actual user context
          'expense_detail_view'
        )
        
        if (result.success && result.signedUrl) {
          setSignedUrl(result.signedUrl)
        } else {
          console.error('Failed to get secure file access:', result.error)
        }
      } catch (error) {
        console.error('Error generating signed URL:', error)
      } finally {
        setLoading(false)
      }
    }

    generateUrl()
  }, [filePath])

  if (loading) {
    return <div>Loading receipt...</div>
  }

  if (!signedUrl) {
    return <div>Unable to load receipt</div>
  }

  const isImage = filePath.match(/\.(jpg|jpeg|png|gif)$/i)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {isImage ? (
        <img 
          src={signedUrl} 
          alt="Receipt" 
          style={{ 
            maxWidth: '200px', 
            maxHeight: '150px', 
            objectFit: 'cover',
            borderRadius: '8px',
            border: '1px solid #d9d9d9'
          }} 
          onError={(e) => {
            console.error('Failed to load receipt image:', signedUrl)
            e.currentTarget.style.display = 'none'
          }}
          onLoad={() => console.log('Receipt image loaded successfully:', signedUrl)}
        />
      ) : (
        <FileTextOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
      )}
      <a href={signedUrl} target="_blank" rel="noopener noreferrer" onClick={() => console.log('Opening receipt URL:', signedUrl)}>
        View Receipt
      </a>
    </div>
  )
}

interface Expense {
  id: number
  budgetId: number | null
  merchant: string
  amount: number

  date: string
  eventId: number | null
  description: string
  receiptUrl: string | null
  createdAt: string
  createdBy: number | null
  updatedAt: string
  updatedBy: number | null
  budgets?: { name: string }
  events?: { name: string }
  createdByUser?: { id: number; username: string; email: string }
  updatedByUser?: { id: number; username: string; email: string }
}

function ExpenseDetail({ expenseId }: { expenseId: string }) {
  const [expense, setExpense] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (expenseId) {
      fetchExpense()
    }
  }, [expenseId])

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
        const expense = await response.json()
        setExpense(expense)
      } else if (response.status === 404) {
        setExpense(null)
      }
    } catch (error) {
      console.error('Error fetching expense:', error)
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    // Go back to main expenses list
    router.push('/expenses')
  }

  const editExpense = () => {
    router.push(`/expenses/${expenseId}/edit`)
  }



  if (loading) {
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
  
  // Debug logging
  console.log('Expense data:', expense)
  console.log('Receipt URL:', expense.receiptUrl)
  
  // Test if receipt URL is accessible
  if (expense.receiptUrl) {
    fetch(expense.receiptUrl, { method: 'HEAD' })
      .then(response => {
        console.log('Receipt URL accessibility test:', response.status, response.ok)
      })
      .catch(error => {
        console.error('Receipt URL accessibility error:', error)
      })
  }

  return (
    <div className={style.container}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
        <Flex align='center' gap={16}>
          <ArrowIcon onClick={goBack} style={{ cursor: 'pointer' }} />
          <div className={style.title}>Expense Details</div>
        </Flex>
        <Button icon={<EditIcon />} onClick={editExpense}>
          Edit Expense
        </Button>
      </Flex>

      <Card>
        <Descriptions title="Expense Information" bordered column={2}>
          <Descriptions.Item label="Date">
            {new Date(expense.date).toLocaleDateString()}
          </Descriptions.Item>
          <Descriptions.Item label="Amount">
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#cf1322' }}>
              ${expense.amount.toLocaleString()}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Merchant">
            {expense.merchant}
          </Descriptions.Item>

          <Descriptions.Item label="Budget">
            {expense.budgets?.name ? 
              <Tag color="purple">{expense.budgets.name}</Tag> : 
              <span style={{ color: '#999' }}>Not assigned</span>
            }
          </Descriptions.Item>
          <Descriptions.Item label="Event">
            {expense.events?.name ? 
              <Tag color="orange">{expense.events.name}</Tag> : 
              <span style={{ color: '#999' }}>Not assigned</span>
            }
          </Descriptions.Item>
          <Descriptions.Item label="Receipt Available">
            {expense.receiptUrl ? 
              <Tag color="green">Yes</Tag> : 
              <Tag color="red">No</Tag>
            }
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            {new Date(expense.createdAt).toLocaleDateString()}
          </Descriptions.Item>
          <Descriptions.Item label="Created By">
            {expense.createdByUser ? 
              <span>{expense.createdByUser.username} ({expense.createdByUser.email})</span> : 
              <span style={{ color: '#999' }}>Unknown</span>
            }
          </Descriptions.Item>
          <Descriptions.Item label="Last Updated">
            {new Date(expense.updatedAt).toLocaleDateString()}
          </Descriptions.Item>
          <Descriptions.Item label="Updated By">
            {expense.updatedByUser ? 
              <span>{expense.updatedByUser.username} ({expense.updatedByUser.email})</span> : 
              <span style={{ color: '#999' }}>Unknown</span>
            }
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>
            {expense.description}
          </Descriptions.Item>
                                           {expense.receiptUrl && (
              <Descriptions.Item label="Receipt" span={2}>
                <ReceiptDisplay filePath={expense.receiptUrl} />
              </Descriptions.Item>
            )}
        </Descriptions>
      </Card>
    </div>
  )
}

export default ExpenseDetail
