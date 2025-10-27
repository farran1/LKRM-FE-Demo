'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, Descriptions, Button, Flex, Tag, Skeleton, Modal } from 'antd'
import { FileTextOutlined, DownloadOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons'
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
  const [showModal, setShowModal] = useState(false)

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

  const handleDownload = async () => {
    if (!signedUrl) return
    
    try {
      const response = await fetch(signedUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Extract filename from filePath or use default
      const filename = filePath.split('/').pop() || 'receipt'
      link.download = filename
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading receipt:', error)
    }
  }

  if (loading) {
    return <div>Loading receipt...</div>
  }

  if (!signedUrl) {
    return <div>Unable to load receipt</div>
  }

  const isImage = filePath.match(/\.(jpg|jpeg|png|gif)$/i)

  return (
    <>
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
              border: '1px solid #d9d9d9',
              cursor: 'pointer'
            }} 
            onClick={() => setShowModal(true)}
            onError={(e) => {
              console.error('Failed to load receipt image:', signedUrl)
              e.currentTarget.style.display = 'none'
            }}
            onLoad={() => console.log('Receipt image loaded successfully:', signedUrl)}
          />
        ) : (
          <FileTextOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
        )}
        <Button 
          type="link" 
          icon={<EyeOutlined />}
          onClick={() => setShowModal(true)}
          style={{ padding: 0 }}
        >
          View Receipt
        </Button>
      </div>

      <Modal
        title="Receipt"
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={[
          <Button key="download" icon={<DownloadOutlined />} onClick={handleDownload}>
            Download
          </Button>
        ]}
        width={800}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          {isImage ? (
            <img 
              src={signedUrl} 
              alt="Receipt" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '500px', 
                objectFit: 'contain',
                borderRadius: '8px',
                border: '1px solid #d9d9d9'
              }} 
            />
          ) : (
            <div style={{ padding: '40px' }}>
              <FileTextOutlined style={{ fontSize: '64px', color: '#1890ff', marginBottom: '16px' }} />
              <div style={{ fontSize: '16px', color: '#666' }}>
                This file type cannot be previewed
              </div>
              <div style={{ fontSize: '14px', color: '#999', marginTop: '8px' }}>
                Click download to save the file
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
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
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get navigation context from URL parameters
  const from = searchParams.get('from')
  const budgetId = searchParams.get('budgetId')

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
      console.log('🔍 Fetching expense with ID:', expenseId)
      const response = await fetch(`/api/expenses/${expenseId}`)
      
      console.log('📡 Response status:', response.status)
      
      if (response.ok) {
        const expense = await response.json()
        console.log('✅ Expense fetched:', expense)
        setExpense(expense)
      } else if (response.status === 404) {
        console.error('❌ Expense not found (404)')
        setExpense(null)
      } else if (response.status === 403) {
        console.error('🚫 Access denied (403)')
        const errorData = await response.json()
        console.error('Error details:', errorData)
        setExpense(null)
      } else {
        console.error('❌ Failed to fetch expense, status:', response.status)
        const errorData = await response.json()
        console.error('Error details:', errorData)
        setExpense(null)
      }
    } catch (error) {
      console.error('💥 Error fetching expense:', error)
      setExpense(null)
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    // Navigate back based on where the user came from
    if (from === 'budget' && budgetId) {
      // Go back to the specific budget detail modal
      router.push(`/budgets?openBudget=${budgetId}`)
    } else if (from === 'expenses') {
      // Go back to expenses list
      router.push('/expenses')
    } else {
      // Default fallback - try browser back, then expenses list
      if (window.history.length > 1) {
        router.back()
      } else {
        router.push('/expenses')
      }
    }
  }

  const editExpense = () => {
    router.push(`/expenses/${expenseId}/edit`)
  }

  const handleDeleteExpense = async () => {
    if (!expense) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Navigate back to expenses list with refresh
        router.push('/expenses?refresh=' + Date.now());
      } else {
        console.error('Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
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
        <div style={{ color: '#ff4d4f', fontSize: '16px', marginBottom: '16px' }}>
          Expense not found (ID: {expenseId})
        </div>
        <div style={{ color: '#fff', marginBottom: '16px' }}>
          This expense may have been deleted or you may not have permission to view it.
        </div>
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
        <Flex gap={8}>
          <Button icon={<EditIcon />} onClick={editExpense}>
            Edit Expense
          </Button>
          <Button 
            icon={<DeleteOutlined />} 
            danger
            onClick={() => setShowDeleteModal(true)}
          >
            Delete Expense
          </Button>
        </Flex>
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

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Expense"
        open={showDeleteModal}
        onOk={handleDeleteExpense}
        onCancel={() => setShowDeleteModal(false)}
        confirmLoading={deleteLoading}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete this expense?</p>
        <p><strong>This action cannot be undone.</strong></p>
      </Modal>
    </div>
  )
}

export default ExpenseDetail
