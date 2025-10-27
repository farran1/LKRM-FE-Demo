'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Card, Progress, Typography, Input, Space, Flex, App } from 'antd';
import { CalendarOutlined, PushpinOutlined } from '@ant-design/icons';
import SearchIcon from '@/components/icon/search.svg';
import PlusIcon from '@/components/icon/plus.svg';
import styles from './style.module.scss';
import CreateBudgetDrawer from './components/CreateBudgetDrawer';
import EditBudgetDrawer from './components/EditBudgetDrawer';
import { supabase } from '@/lib/supabase';
import BudgetDetailModal from './components/BudgetDetailModal';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import { useRouter } from 'next/navigation';

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
  Season: string;
  is_pinned: boolean;
}

export default function BudgetsPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [budgets, setBudgets] = useState<BudgetCard[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [showAllBudgets, setShowAllBudgets] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<BudgetCard | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Fetch budgets from API
  const fetchBudgets = useCallback(async (searchTerm: string = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        Season: '2025-2026',
        ...(searchTerm && { search: searchTerm })
      });
      
      const response = await fetch(`/api/budgets?${params}`);
      if (response.ok) {
        const result = await response.json();
        setBudgets(result.data || []);
        setTotalSpent(result.totalSpent || 0);
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
  }, [message]);

  // Use debounced search hook
  const {
    searchTerm,
    setSearchTerm,
    isSearching,
    handleImmediateSearch,
    clearSearch
  } = useDebouncedSearch('', 500, fetchBudgets);

  useEffect(() => {
    fetchBudgets(); // Initial load
  }, [fetchBudgets]);

  // Realtime: refetch budgets when expenses change
  useEffect(() => {
    const channel = supabase
      .channel('expenses-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
        // Refetch without search term to get all budgets
        fetchBudgets('');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Remove fetchBudgets dependency to prevent recreation

  const handleCreateBudget = () => {
    setShowCreateDrawer(true);
  };

  const resetToDefaultView = () => {
    // Reset to default view with no filters
    router.push('/budgets');
  };

  const handleBudgetCreated = () => {
    fetchBudgets(); // Refresh the list
  };

  const handleBudgetUpdated = () => {
    fetchBudgets(); // Refresh the list
  };

  const handleEditBudget = (budget: BudgetCard) => {
    setSelectedBudget(budget);
    setShowEditDrawer(true);
    setShowDetail(false); // Close detail modal when editing
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

  const handleDeleteBudget = async (budgetId: number) => {
    try {
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        message.success('Budget deleted successfully');
        fetchBudgets(); // Refresh the budgets list
        setShowDetail(false); // Close detail modal
        setSelectedBudget(null);
      } else {
        const error = await response.json();
        message.error(error.error || 'Failed to delete budget');
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
      message.error('Failed to delete budget');
    }
  };

  const togglePin = async (budgetId: number) => {
    const budget = budgets.find(b => b.id === budgetId);
    if (!budget) return;

    try {
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_pinned: !budget.is_pinned }),
      });

      if (response.ok) {
        // Update local state immediately for better UX
        setBudgets(prev => prev.map(b => 
          b.id === budgetId ? { ...b, is_pinned: !b.is_pinned } : b
        ));
        message.success(budget.is_pinned ? 'Budget unpinned' : 'Budget pinned');
      } else {
        const error = await response.json();
        message.error(error.error || 'Failed to update budget');
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      message.error('Failed to update budget');
    }
  };

  // Get budget card styles based on pin status
  const getBudgetCardStyles = (isPinned: boolean) => ({
    border: isPinned ? '2px solid #4ecdc4' : '1px solid rgba(255,255,255,0.1)',
    boxShadow: isPinned ? '0 4px 12px rgba(78, 205, 196, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
    transform: isPinned ? 'scale(1.02)' : 'scale(1)',
    transition: 'all 0.3s ease',
    background: isPinned ? 'linear-gradient(135deg, rgba(78, 205, 196, 0.05), rgba(68, 160, 141, 0.05))' : 'inherit'
  });

  // Get pin button styles based on pin status
  const getPinButtonStyles = (isPinned: boolean) => ({
    background: isPinned ? 'rgba(78, 205, 196, 0.2)' : 'rgba(255, 255, 255, 0.9)',
    border: isPinned ? '1px solid #4ecdc4' : 'none',
    color: isPinned ? '#4ecdc4' : '#666',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    fontWeight: isPinned ? 'bold' : 'normal'
  });

  // Get title styles based on pin status
  const getTitleStyles = (isPinned: boolean) => ({
    color: isPinned ? '#4ecdc4' : 'inherit',
    fontWeight: isPinned ? '600' : 'normal'
  });

  // Sort budgets with pinned items first, then apply view limit
  const sortedBudgets = [...budgets].sort((a, b) => {
    // Pinned first
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    // Then by creation date (newest first)
    return b.id - a.id;
  });
  
  // Apply view limit after sorting
  const displayedBudgets = showAllBudgets ? sortedBudgets : sortedBudgets.slice(0, 6);

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
              onChange={(e) => setSearchTerm(e.target.value as string)}
              onPressEnter={handleImmediateSearch}
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
            <Flex justify="space-between" align="center">
              <h2>This Season (2025-2026)</h2>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#fff',
                backgroundColor: 'rgba(255,255,255,0.1)',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                Total Spent: ${totalSpent.toLocaleString()}
              </div>
            </Flex>
          </div>
          <div style={{ textAlign: 'center', padding: '40px', color: '#fff' }}>
            Loading buckets...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageRoot}>
      <div className={styles.toolbar}>
        <Flex align='flex-end' gap={16}>
          <div className={styles.pageTitle} onClick={resetToDefaultView} style={{ cursor: 'pointer' }}>Budgets</div>
        </Flex>
        <Flex gap={10}>
          <Input
            placeholder="Search"
            className={styles.search}
            prefix={<SearchIcon />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value as string)}
            onPressEnter={handleImmediateSearch}
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
          <Flex justify="space-between" align="center">
            <h2>This Season (2025-2026)</h2>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#fff',
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              Total Spent: ${totalSpent.toLocaleString()}
            </div>
          </Flex>
        </div>
        
        {displayedBudgets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#fff' }}>
            {searchTerm ? 'No buckets found matching your search.' : (
              <div>
                <div style={{ fontSize: '18px', marginBottom: '16px' }}>
                  No buckets created yet for this season.
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '24px' }}>
                  Create your first bucket to start tracking team expenses.
                </div>
                <Button 
                  type="primary" 
                  icon={<PlusIcon />}
                  onClick={handleCreateBudget}
                  size="large"
                >
                  Create Your First Bucket
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className={styles.bucketGrid}>
              {displayedBudgets.map((budget) => (
                <Card 
                  key={budget.id} 
                  className={styles.bucketCard} 
                  onClick={() => openBudgetDetail(budget)}
                  style={getBudgetCardStyles(budget.is_pinned)}
                >
                  {/* Pin Icon */}
                  <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePin(budget.id);
                      }}
                      style={getPinButtonStyles(budget.is_pinned)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(78, 205, 196, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = budget.is_pinned ? 'rgba(78, 205, 196, 0.2)' : 'rgba(255, 255, 255, 0.9)';
                      }}
                    >
                      <PushpinOutlined />
                    </button>
                  </div>
                  
        {/* Pinned Badge */}
        {/* {budget.is_pinned && (
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'linear-gradient(135deg, #4ecdc4, #44a08d)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            Pinned
          </div>
        )} */}
                  
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitle} style={getTitleStyles(budget.is_pinned)}>
                      {budget.title}
                    </div>
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
                  {showAllBudgets ? 'Hide Budgets' : 'View All Buckets'}
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
      <BudgetDetailModal 
        open={showDetail} 
        onClose={closeBudgetDetail} 
        budget={selectedBudget}
        onDelete={handleDeleteBudget}
        onEdit={handleEditBudget}
      />
      <EditBudgetDrawer
        open={showEditDrawer}
        onClose={() => setShowEditDrawer(false)}
        onSuccess={handleBudgetUpdated}
        budget={selectedBudget}
      />
    </div>
  );
}


