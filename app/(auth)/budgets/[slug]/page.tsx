'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Typography, Progress, Button, Table, Tag, Space, Statistic, Row, Col } from 'antd';
import { ArrowLeftOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import TrashIcon from '@/components/icon/trash.svg';
import styles from './style.module.scss';
import ExpensesChart from './ExpensesChart';

const { Title, Text, Paragraph } = Typography;

interface Budget {
  id: number;
  name: string;
  amount: number;
  period: string;
  description?: string;
  categoryId: number;
  category: {
    name: string;
    color: string;
  };
  season: string;
  createdAt: string;
  updatedAt: string;
}

interface Expense {
  id: number;
  merchant: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
  receiptUrl?: string;
  eventId?: number;
  event?: {
    name: string;
  };
}

interface BudgetDetails {
  budget: Budget;
  expenses: Expense[];
  totalSpent: number;
  remaining: number;
  spentPercentage: number;
}

export default function BucketDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const [budgetDetails, setBudgetDetails] = useState<BudgetDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [budgetId, setBudgetId] = useState<number | null>(null);

  useEffect(() => {
    const fetchBudgetDetails = async () => {
      try {
        const resolvedParams = await params;
        const slug = resolvedParams.slug;
        
        // Try to parse slug as budget ID first
        const id = parseInt(slug);
        if (!isNaN(id)) {
          setBudgetId(id);
          await fetchBudgetById(id);
        } else {
          // If not a number, try to find by name (fallback)
          await fetchBudgetByName(slug);
        }
      } catch (error) {
        console.error('Error fetching budget details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBudgetDetails();
  }, []); // Remove params from dependency array to avoid read-only property errors

  const fetchBudgetById = async (id: number) => {
    try {
      const response = await fetch(`/api/budgets/${id}`);
      if (response.ok) {
        const data = await response.json();
        setBudgetDetails(data.data);
      } else {
        console.error('Failed to fetch budget:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching budget:', error);
    }
  };

  const fetchBudgetByName = async (name: string) => {
    try {
      const response = await fetch(`/api/budgets?name=${encodeURIComponent(name)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          const budget = data.data[0];
          setBudgetId(budget.id);
          await fetchBudgetById(budget.id);
        }
      } else {
        console.error('Failed to fetch budget by name:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching budget by name:', error);
    }
  };

  const handleBudgetDeleted = async () => {
    // Redirect back to budgets page
    window.location.href = '/budgets';
  };

  const handleExpenseDeleted = async (expenseId: number) => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        // Refresh budget details
        if (budgetId) {
          await fetchBudgetById(budgetId);
        }
      } else {
        console.error('Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  if (loading) {
    return <div>Loading budget details...</div>;
  }

  if (!budgetDetails) {
    return (
      <main className={styles.detailsRoot}>
        <div className={styles.headerBar}>
          <div className={styles.backRow}>
            <Link href="/budgets" className={styles.backLink}>
              <ArrowLeftOutlined /> Back
            </Link>
            <Title level={1} className={styles.pageTitle}>
              Budget Not Found
            </Title>
          </div>
        </div>
        <div className={styles.detailsGrid}>
          <Card className={styles.summaryCard}>
            <div className={styles.summaryHead}>
              <div className={styles.summaryTitle}>Budget Not Found</div>
              <div className={styles.summaryCadence}>No Data</div>
            </div>
            <Paragraph className={styles.description}>
              The requested budget could not be found. Please check the URL or return to the budgets list.
            </Paragraph>
            <Link href="/budgets">
              <Button type="primary">Return to Budgets</Button>
            </Link>
          </Card>
        </div>
      </main>
    );
  }

  const { budget, expenses, totalSpent, remaining, spentPercentage } = budgetDetails;

  return (
    <main className={styles.detailsRoot}>
      <div className={styles.headerBar}>
        <div className={styles.backRow}>
          <Link href="/budgets" className={styles.backLink}>
            <ArrowLeftOutlined /> Back
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Title level={1} className={styles.pageTitle}>
              Budget / {budget.name}
            </Title>
            <TrashIcon 
              onClick={handleBudgetDeleted}
              style={{ 
                cursor: 'pointer', 
                color: '#ff4d4f',
                width: '20px',
                height: '20px'
              }}
            />
          </div>
        </div>
        <Space>
          <Button icon={<EditOutlined />}>Edit Budget</Button>
        </Space>
      </div>

      <div className={styles.detailsGrid}>
        {/* Budget Summary Card */}
        <Card className={styles.summaryCard}>
          <div className={styles.summaryHead}>
            <div className={styles.summaryTitle}>{budget.name}</div>
            <div className={styles.summaryCadence}>
              {budget.period} ({budget.season})
            </div>
          </div>
          <Paragraph className={styles.description}>
            {budget.description || 'No description provided.'}
          </Paragraph>
          
          <Row gutter={16} className={styles.summaryStats}>
            <Col span={8}>
              <Statistic
                title="Total Budget"
                value={budget.amount}
                prefix="$"
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Spent"
                value={totalSpent}
                prefix="$"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Remaining"
                value={remaining}
                prefix="$"
                valueStyle={{ color: remaining >= 0 ? '#52c41a' : '#f5222d' }}
              />
            </Col>
          </Row>

          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <Text>Budget Usage</Text>
              <Text>{spentPercentage.toFixed(1)}%</Text>
            </div>
            <Progress
              percent={Math.min(100, spentPercentage)}
              strokeColor={spentPercentage > 100 ? '#f5222d' : '#52c41a'}
              showInfo={false}
            />
          </div>
        </Card>

        {/* Expenses Chart */}
        <Card title="Spending Over Time" className={styles.chartCard}>
          <ExpensesChart budgetId={budget.id} />
        </Card>

        {/* Expenses Table */}
        <Card 
          title="Expenses" 
          className={styles.expensesCard}
          extra={
            <Button type="primary" icon={<PlusOutlined />}>
              Add Expense
            </Button>
          }
        >
          <Table
            dataSource={expenses}
            columns={[
              {
                title: 'Date',
                dataIndex: 'date',
                key: 'date',
                render: (date: string) => new Date(date).toLocaleDateString(),
                sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
              },
              {
                title: 'Merchant',
                dataIndex: 'merchant',
                key: 'merchant',
              },
              {
                title: 'Category',
                dataIndex: 'category',
                key: 'category',
                render: (category: string) => (
                  <Tag color="blue">{category}</Tag>
                ),
              },
              {
                title: 'Amount',
                dataIndex: 'amount',
                key: 'amount',
                render: (amount: number) => `$${amount.toLocaleString()}`,
                sorter: (a, b) => a.amount - b.amount,
              },
              {
                title: 'Description',
                dataIndex: 'description',
                key: 'description',
                ellipsis: true,
                render: (description: string) => {
                  if (!description) return '-'
                  return description.length > 50 ? 
                    `${description.substring(0, 50)}...` : 
                    description
                },
              },
              {
                title: 'Event',
                dataIndex: ['event', 'name'],
                key: 'event',
                ellipsis: true,
                render: (eventName: string, record: any) => {
                  if (!record.event || !record.event.name) return 'N/A'
                  return (
                    <span 
                      style={{ 
                        color: '#1D75D0', 
                        textDecoration: 'underline',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        // Events use popup modals, not separate pages
                        console.log('Event navigation disabled - events use popup modals')
                      }}
                    >
                      {record.event.name}
                    </span>
                  )
                },
              },
              {
                title: 'Actions',
                key: 'actions',
                render: (_, record: Expense) => (
                  <Space>
                    <Button type="text" size="small">
                      View
                    </Button>
                    <Button type="text" size="small">
                      Edit
                    </Button>
                    <Button 
                      type="text" 
                      size="small" 
                      danger
                      onClick={() => handleExpenseDeleted(record.id)}
                    >
                      Delete
                    </Button>
                  </Space>
                ),
              },
            ]}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
            }}
            rowKey="id"
          />
        </Card>
      </div>
    </main>
  );
}


