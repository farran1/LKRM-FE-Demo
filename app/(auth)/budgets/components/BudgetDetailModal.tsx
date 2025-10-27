"use client";

import { useEffect, useState, useMemo } from 'react';
import { App, Modal, List, Typography, Progress, Flex, Button } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import style from './budget-detail-modal.module.scss'
import CloseIcon from '@/components/icon/close.svg'
import TrashIcon from '@/components/icon/trash.svg'
import EditIcon from '@/components/icon/edit.svg'
import { useRouter } from 'next/navigation'
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal'

interface BudgetDetailModalProps {
  open: boolean;
  onClose: () => void;
  budget: {
    id: number;
    title: string;
    totalBudget: number;
    spent: number;
    percentage: number;
    period: string;
    description?: string;
    autoRepeat: boolean;
    Season: string;
    is_pinned: boolean;
  } | null;
  onDelete?: (budgetId: number) => void;
  onEdit?: (budget: any) => void;
}

interface ExpenseItem {
  id: number;
  name?: string;
  merchant?: string;
  description?: string;
  notes?: string;
  amount: number;
  date?: string;
}

export default function BudgetDetailModal({ open, onClose, budget, onDelete, onEdit }: any) {
  const { message } = App.useApp();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const router = useRouter();

  const remaining = useMemo(() => {
    const total = budget?.totalBudget || 0;
    const spent = budget?.spent || 0;
    return Math.max(total - spent, 0);
  }, [budget?.totalBudget, budget?.spent]);

  useEffect(() => {
    const load = async () => {
      if (!open || !budget?.id) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/expenses?budgetId=${budget.id}`);
        if (!res.ok) throw new Error('Failed to fetch expenses');
        const json = await res.json();
        setExpenses(json.data || []);
      } catch (err) {
        console.error(err);
        message.error('Failed to load expenses');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, budget?.id]);

  // Determine progress bar color based on spending percentage
  const progressColor = useMemo(() => {
    if (!budget) return '#34c759';
    const percentage = budget.percentage;
    
    if (percentage >= 100) {
      return '#f5222d'; // Red for over budget
    } else if (percentage >= 80) {
      return '#ff3b30'; // Red for high spending
    } else if (percentage >= 60) {
      return '#ff9500'; // Orange for medium spending
    } else {
      return '#34c759'; // Green for low spending
    }
  }, [budget?.percentage]);

  const openExpenseDetail = (expenseId: number) => {
    router.push(`/expenses/${expenseId}`);
  };

  const handleDeleteBudget = async () => {
    if (!budget || !onDelete) return;

    setDeleteLoading(true);
    try {
      await onDelete(budget.id);
      setShowDeleteModal(false);
      onClose(); // Close the detail modal after successful deletion
    } catch (error) {
      console.error('Error deleting budget:', error);
      message.error('Failed to delete budget');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Modal
      closeIcon={null}
      open={open}
      footer={null}
      className={style.container}
      rootClassName={style.root}
      destroyOnHidden
      maskClosable={true}
      onCancel={onClose}
      width={760}
      closable={false}
    >
      {budget && (
        <>
          <Flex className={style.header} justify="space-between" align='center'>
            <Flex align="center" gap={12}>
              <div className={style.title}>{budget.title}</div>
              <Flex align="center" gap={8}>
                {onEdit && (
                  <EditIcon 
                    onClick={() => onEdit(budget)}
                    style={{ 
                      cursor: 'pointer', 
                      color: '#1890ff',
                      width: '16px',
                      height: '16px'
                    }}
                  />
                )}
                {onDelete && (
                  <TrashIcon 
                    onClick={() => setShowDeleteModal(true)}
                    style={{ 
                      cursor: 'pointer', 
                      color: '#ff4d4f',
                      width: '16px',
                      height: '16px'
                    }}
                  />
                )}
              </Flex>
            </Flex>
            <CloseIcon onClick={onClose} />
          </Flex>

          <Flex justify="space-between" align="stretch" className={style.metrics} gap={24}>
            <Flex align="center" gap={20} className={style.metricsLeft}>
              <div style={{ position: 'relative' }}>
                <Progress
                  type="dashboard"
                  percent={Math.min(budget.percentage, 100)}
                  strokeColor={progressColor}
                  trailColor="rgba(255,255,255,0.15)"
                  size={120}
                  format={() => null}
                />
                {/* Show warning sign for over-budget instead of checkmark */}
                {budget.percentage > 100 && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '24px',
                    color: '#ff4d4f'
                  }}>
                    <ExclamationCircleFilled />
                  </div>
                )}
              </div>
              <div>
                <div className={style.label}>Total Budget</div>
                <div className={style.valueLarge}>${budget.totalBudget.toLocaleString()}</div>
                <div className={style.label} style={{ marginTop: 10 }}>Remaining</div>
                <div className={style.valueLarge}>${remaining.toLocaleString()}</div>
              </div>
            </Flex>
            <div className={style.metricsRight}>
              <div className={style.label}>Spent</div>
              <div className={style.valueLarge}>${budget.spent.toLocaleString()}</div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>
                {budget.percentage > 100 ? (
                  <span style={{ color: '#ff4d4f' }}>
                    {budget.percentage.toFixed(1)}% used (Over Budget)
                  </span>
                ) : (
                  `${budget.percentage.toFixed(1)}% used`
                )}
              </div>
            </div>
          </Flex>

          <Typography.Title level={5} className={style.sectionTitle}>Expenses</Typography.Title>
          <List
            className={style.expenseList}
            loading={loading}
            dataSource={expenses}
            locale={{ emptyText: 'No expenses yet.' }}
            renderItem={(item) => (
              <List.Item className={style.expenseItem} onClick={() => openExpenseDetail(item.id)}>
                <List.Item.Meta
                  title={
                    <span className={style.expenseTitle}>
                      {(() => {
                        const title = item.name || item.description || 'Expense'
                        return title.length > 60 ? `${title.substring(0, 60)}...` : title
                      })()}
                    </span>
                  }
                  description={
                    <span className={style.expenseMeta}>
                      {item.merchant ? `${item.merchant} • ` : ''}
                      {item.date ? new Date(item.date).toLocaleDateString() : ''}
                      {item.notes ? ` • ${item.notes}` : ''}
                    </span>
                  }
                />
                <div className={style.expenseAmount}>${Number(item.amount).toLocaleString()}</div>
              </List.Item>
            )}
          />
        </>
      )}
      
      <DeleteConfirmationModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteBudget}
        title="Delete Budget"
        itemName={budget?.title || ''}
        itemType="budget bucket"
        loading={deleteLoading}
      />
    </Modal>
  );
}
