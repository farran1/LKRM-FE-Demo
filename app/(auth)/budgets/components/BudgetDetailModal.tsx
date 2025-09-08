"use client";

import { useEffect, useState, useMemo } from 'react';
import { App, Modal, List, Typography, Progress, Flex } from 'antd';
import style from './budget-detail-modal.module.scss'
import CloseIcon from '@/components/icon/close.svg'
import { useRouter } from 'next/navigation'

interface BudgetDetailModalProps {
  open: boolean;
  onClose: () => void;
  budget: {
    id: number;
    title: string;
    totalBudget: number;
    spent: number;
    percentage: number;
  } | null;
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

export default function BudgetDetailModal({ open, onClose, budget }: BudgetDetailModalProps) {
  const { message } = App.useApp();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(false);
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

  const progressColor = budget && budget.percentage >= 80 ? '#ff6b6b' : budget && budget.percentage >= 60 ? '#ffb020' : '#1d75d0';

  const openExpenseDetail = (expenseId: number) => {
    router.push(`/expenses/${expenseId}`);
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
            <div className={style.title}>{budget.title}</div>
            <CloseIcon onClick={onClose} />
          </Flex>

          <Flex justify="space-between" align="stretch" className={style.metrics} gap={24}>
            <Flex align="center" gap={20} className={style.metricsLeft}>
              <Progress
                type="dashboard"
                percent={Math.min(budget.percentage, 100)}
                strokeColor={progressColor}
                trailColor="rgba(255,255,255,0.15)"
                size={120}
              />
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
                  title={<span className={style.expenseTitle}>{item.name || item.description || 'Expense'}</span>}
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
    </Modal>
  );
}
