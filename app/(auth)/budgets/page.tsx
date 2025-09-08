'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Progress, Typography, Input, Space, Flex, message } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import SearchIcon from '@/components/icon/search.svg';
import PlusIcon from '@/components/icon/plus.svg';
import styles from './style.module.scss';
import CreateBudgetDrawer from './components/CreateBudgetDrawer';
import { supabase } from '@/lib/supabase';
import BudgetDetailModal from './components/BudgetDetailModal';

const { Title } = Typography;

interface BudgetCard {
  id: number;
  title: string;
  period: string;
  totalBudget: number;
  spent: number;
  percentage: number;
  barColor: string;
  description?: string;
  autoRepeat: boolean;
  season: string;
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [showAllBudgets, setShowAllBudgets] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<BudgetCard | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Fetch budgets from API
  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        season: '2025-2026',
        ...(searchTerm && { search: searchTerm }),
        ...(showAllBudgets && { includeArchived: 'true' })
      });
      
      const response = await fetch(`/api/budgets?${params}`);
      if (response.ok) {
        const result = await response.json();
        setBudgets(result.data || []);
      } else {
        console.error('Failed to fetch budgets:', response.statusText);
        message.error('Failed to fetch budgets');
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
      message.error('Error fetching budgets');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, showAllBudgets]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // Realtime: refetch budgets when expenses change
  useEffect(() => {
    const channel = supabase
      .channel('expenses-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
        fetchBudgets();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBudgets]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleCreateBudget = () => {
    setShowCreateDrawer(true);
  };

  const handleBudgetCreated = () => {
    fetchBudgets(); // Refresh the list
  };

  const toggleShowAllBudgets = () => {
    setShowAllBudgets(!showAllBudgets);
  };

  const openBudgetDetail = (budget: BudgetCard) => {
    setSelectedBudget(budget);
    setShowDetail(true);
  };
  const closeBudgetDetail = () => {
    setShowDetail(false);
    setSelectedBudget(null);
  };

  // Get budgets to display (top 6 or all)
  const displayedBudgets = showAllBudgets ? budgets : budgets.slice(0, 6);

  if (loading) {
    return (
      <div className={styles.pageRoot}>
        <div className={styles.toolbar}>
          <Flex align='flex-end' gap={16}>
            <div className={styles.pageTitle}>Budgets</div>
          </Flex>
          <Flex gap={10}>
            <Input
              placeholder="Search"
              className={styles.search}
              prefix={<SearchIcon />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onPressEnter={() => handleSearch(searchTerm)}
              allowClear
            />
            <Button 
              type="primary" 
              icon={<PlusIcon />}
              className={styles.primaryBtn}
              size="large"
              onClick={handleCreateBudget}
            >
              Create New Bucket
            </Button>
          </Flex>
        </div>
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2>This Season (2025-2026)</h2>
          </div>
          <div style={{ textAlign: 'center', padding: '40px', color: '#fff' }}>
            Loading budgets...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageRoot}>
      <div className={styles.toolbar}>
        <Flex align='flex-end' gap={16}>
          <div className={styles.pageTitle}>Budgets</div>
        </Flex>
        <Flex gap={10}>
          <Input
            placeholder="Search"
            className={styles.search}
            prefix={<SearchIcon />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onPressEnter={() => handleSearch(searchTerm)}
            allowClear
          />
          <Button 
            type="primary" 
            icon={<PlusIcon />}
            className={styles.primaryBtn}
            size="large"
            onClick={handleCreateBudget}
          >
            Create New Bucket
          </Button>
        </Flex>
      </div>

      {/* Active Budgets Section */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2>This Season (2025-2026)</h2>
        </div>
        
        {displayedBudgets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#fff' }}>
            {searchTerm ? 'No budgets found matching your search.' : (
              <div>
                <div style={{ fontSize: '18px', marginBottom: '16px' }}>
                  No budgets created yet for this season.
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '24px' }}>
                  Create your first budget to start tracking team expenses.
                </div>
                <Button 
                  type="primary" 
                  icon={<PlusIcon />}
                  onClick={handleCreateBudget}
                  size="large"
                >
                  Create Your First Budget
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className={styles.bucketGrid}>
              {displayedBudgets.map((budget) => (
                <Card key={budget.id} className={styles.bucketCard} onClick={() => openBudgetDetail(budget)}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>{budget.title}</div>
                    <div className={styles.cardSub}>
                      <CalendarOutlined style={{ marginRight: 8 }} />
                      {budget.period}
                    </div>
                  </div>
                  
                  <div className={styles.inlineStats}>
                    <div>
                      <div>Total Budget</div>
                      <div style={{ fontSize: '18px', fontWeight: '600' }}>
                        ${budget.totalBudget.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div>Spent</div>
                      <div style={{ fontSize: '18px', fontWeight: '600' }}>
                        ${budget.spent.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.progressTrack}>
                    <div 
                      className={styles.progressFill}
                      style={{ 
                        width: `${Math.min(budget.percentage, 100)}%`,
                        backgroundColor: budget.barColor
                      }}
                    />
                  </div>
                  
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                    {budget.percentage}% used
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Show View All / Hide Budgets button if there are more than 6 budgets */}
            {budgets.length > 6 && (
              <div className={styles.viewAllRow}>
                <Button 
                  className={styles.linkBtn}
                  onClick={toggleShowAllBudgets}
                >
                  {showAllBudgets ? 'Hide Budgets' : 'View All Budgets'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      <CreateBudgetDrawer
        open={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        onSuccess={handleBudgetCreated}
      />
      <BudgetDetailModal open={showDetail} onClose={closeBudgetDetail} budget={selectedBudget}
      />
    </div>
  );
}


