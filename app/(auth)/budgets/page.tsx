 'use client';
 
import React, { useState } from 'react';
 import styles from './style.module.scss';
 import { Input, Button } from 'antd';
 import { PlusOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import Link from 'next/link';
import NewBudgetDrawer from './NewBudgetDrawer';
 
 type BudgetCard = {
   title: string;
   cadence: string;
   total: number;
   spent: number;
   barColor: string;
 };
 
 const ACTIVE_BUDGETS: BudgetCard[] = [
   {
     title: 'Equipment Maintenance',
     cadence: 'Quarterly (Jan - March)',
     total: 10200,
     spent: 7900,
     barColor: '#f59e0c',
   },
   {
     title: 'Food & Drink',
     cadence: 'Monthly (Feb 2025)',
     total: 5000,
     spent: 4200,
     barColor: '#f59e0c',
   },
   {
     title: 'Tournament & League Fees',
     cadence: 'Yearly (2025)',
     total: 25000,
     spent: 25500,
     barColor: '#da2f36',
   },
   {
     title: 'Travel & Transportation',
     cadence: 'Quarterly (Jan - March)',
     total: 10000,
     spent: 6750,
     barColor: '#429676',
   },
   {
     title: 'Food & Drink',
     cadence: 'Monthly (Feb 2025)',
     total: 5000,
     spent: 4200,
     barColor: '#f59e0c',
   },
   {
     title: 'Tournament & League Fees',
     cadence: 'Yearly (2025)',
     total: 25000,
     spent: 25500,
     barColor: '#da2f36',
   },
 ];
 
  export default function BudgetsPage() {
   const consumed = 70750;
   const masterTotal = 100000;
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({
    '2025': false,
    '2024': false,
    '2023': false,
  });
   const [showNewBudget, setShowNewBudget] = useState(false);
  const ALL_BUCKET_CARDS: BudgetCard[] = [
    { title: 'Travel & Transportation', cadence: 'Quarterly (Jan - March)', total: 10000, spent: 6750, barColor: '#429676' },
    { title: 'Food & Drink', cadence: 'Monthly (Feb 2025)', total: 5000, spent: 4200, barColor: '#f59e0c' },
    { title: 'Tournament & League Fees', cadence: 'Yearly (2025)', total: 25000, spent: 25500, barColor: '#da2f36' },
    { title: 'Coaching Staff & Training', cadence: 'Monthly (Feb 2025)', total: 5000, spent: 4200, barColor: '#f59e0c' },
    { title: 'Equipment & Uniforms', cadence: 'Quarterly (Jan - March)', total: 10000, spent: 6750, barColor: '#429676' },
    { title: 'Technology & Licenses', cadence: 'Yearly (2025)', total: 25000, spent: 25500, barColor: '#da2f36' },
  ];
 
   return (
     <div className={styles.pageRoot}>
       {/* Top toolbar under your header */}
       <div className={styles.toolbar}> 
         <div className={styles.titleRow}>
           <h1 className={styles.pageTitle}>Budgets</h1>
           <Button className={styles.filterBtn} icon={<FilterOutlined />}>
             Filters
           </Button>
         </div>
         <div className={styles.actionsRow}>
           <Input
             allowClear
             placeholder="Search"
             prefix={<SearchOutlined />}
             className={styles.search}
           />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className={styles.primaryBtn}
              onClick={() => setShowNewBudget(true)}
            >
              Create New Bucket
            </Button>
         </div>
       </div>
 
       {/* Active Budgets */}
       <section className={styles.sectionCard}>
         <div className={styles.sectionHeader}>
           <h2>Active Budgets</h2>
         </div>
         <div className={styles.grid3}>
          {ACTIVE_BUDGETS.map((b, idx) => (
            <Link
              key={`${b.title}-${idx}`}
              className={styles.budgetCard}
              href={`/budgets/${b.title.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`}
              aria-label={`Open ${b.title} budget`}
            >
               <div className={styles.cardHeader}>
                 <div className={styles.cardTitle}>{b.title}</div>
                 <div className={styles.cardSub}>{b.cadence}</div>
               </div>
               <div className={styles.rowBetween}>
                 <span>Total Budget</span>
                 <span>${b.total.toLocaleString()}</span>
               </div>
               <div className={styles.rowBetween}>
                 <span>Spent</span>
                 <span>
                   ${b.spent.toLocaleString()} (
                   {Math.round((b.spent / b.total) * 100)}%)
                 </span>
               </div>
               <div className={styles.progressTrack}>
                 <div
                   className={styles.progressFill}
                   style={{
                     width: `${Math.min(100, (b.spent / b.total) * 100)}%`,
                     background: b.barColor,
                   }}
                 />
               </div>
             </Link>
           ))}
          </div>
         <div className={styles.viewAllRow}>
           <button className={styles.linkBtn}>View All</button>
         </div>
       </section>
 
        {/* All Budgets */}
       <section className={styles.sectionCard}>
         <div className={styles.sectionHeader}>
           <h2>All Budgets</h2>
         </div>
          {/* 2025 row (collapsed by default; expand to show buckets) */}
          <div className={styles.listRow}>
            <div className={styles.listRowBody}>
              <div className={styles.listRowHead}>
                <div className={styles.cardTitle}>Budget 2025</div>
                <div className={styles.cardSub}>Yearly (Jan - Dec)</div>
              </div>
              <div className={styles.inlineStats}>
                <div><span>Total Budget</span><strong> ${masterTotal.toLocaleString()}</strong></div>
                <div><span>Consumed</span><strong> ${consumed.toLocaleString()}</strong></div>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${(consumed / masterTotal) * 100}%`, background: '#429676' }} />
              </div>
            </div>
            <div className={styles.rightActions}>
              <Button
                className={styles.ghostBtn}
                onClick={() => setExpandedRows(prev => ({ ...prev, '2025': !prev['2025'] }))}
              >
                {expandedRows['2025'] ? 'Hide Buckets' : 'View Buckets'}
              </Button>
            </div>
          </div>
          {expandedRows['2025'] && (
            <div className={styles.nestedBuckets}>
              <div className={styles.bucketGrid}>
                {ALL_BUCKET_CARDS.map((b, idx) => (
                  <Link key={`2025-${b.title}-${idx}`} className={styles.bucketCard} href={`/budgets/${b.title.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`}>
                    <div className={styles.cardHeader}>
                      <div className={styles.cardTitle}>{b.title}</div>
                      <div className={styles.cardSub}>{b.cadence}</div>
                    </div>
                    <div className={styles.rowBetween}><span>Total Budget</span><span>${b.total.toLocaleString()}</span></div>
                    <div className={styles.rowBetween}><span>Spent</span><span>${b.spent.toLocaleString()}</span></div>
                    <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${Math.min(100, (b.spent / b.total) * 100)}%`, background: b.barColor }} /></div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 2024 row */}
          <div className={styles.listRow}>
          <div className={styles.listRowBody}>
            <div className={styles.listRowHead}>
                <div className={styles.cardTitle}>Budget 2024</div>
                <div className={styles.cardSub}>Yearly (Jan - Dec)</div>
            </div>
            <div className={styles.inlineStats}>
              <div><span>Total Budget</span><strong> $10,000</strong></div>
              <div><span>Spent</span><strong> $6,750</strong></div>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: '77%', background: '#f59e0c' }} />
            </div>
          </div>
            <div className={styles.rightActions}>
              <Button
                className={styles.ghostBtn}
                onClick={() => setExpandedRows(prev => ({ ...prev, '2024': !prev['2024'] }))}
              >
                {expandedRows['2024'] ? 'Hide Buckets' : 'View Buckets'}
              </Button>
            </div>
        </div>
          {expandedRows['2024'] && (
            <div className={styles.nestedBuckets}>
              <div className={styles.bucketGrid}>
                {ALL_BUCKET_CARDS.slice(0, 4).map((b, idx) => (
                  <Link key={`2024-${b.title}-${idx}`} className={styles.bucketCard} href={`/budgets/${b.title.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`}>
                    <div className={styles.cardHeader}><div className={styles.cardTitle}>{b.title}</div><div className={styles.cardSub}>{b.cadence}</div></div>
                    <div className={styles.rowBetween}><span>Total Budget</span><span>${b.total.toLocaleString()}</span></div>
                    <div className={styles.rowBetween}><span>Spent</span><span>${b.spent.toLocaleString()}</span></div>
                    <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${Math.min(100, (b.spent / b.total) * 100)}%`, background: b.barColor }} /></div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 2023 row */}
          <div className={styles.listRow}>
          <div className={styles.listRowBody}>
            <div className={styles.listRowHead}>
              <div className={styles.cardTitle}>Budget 2023</div>
              <div className={styles.cardSub}>Yearly (Jan - Dec)</div>
            </div>
            <div className={styles.inlineStats}>
              <div><span>Total Budget</span><strong> $10,000</strong></div>
              <div><span>Spent</span><strong> $10,000</strong></div>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: '100%', background: '#da2f36' }} />
            </div>
          </div>
            <div className={styles.rightActions}>
              <Button
                className={styles.ghostBtn}
                onClick={() => setExpandedRows(prev => ({ ...prev, '2023': !prev['2023'] }))}
              >
                {expandedRows['2023'] ? 'Hide Buckets' : 'View Buckets'}
              </Button>
            </div>
          </div>
          {expandedRows['2023'] && (
            <div className={styles.nestedBuckets}>
              <div className={styles.bucketGrid}>
                {ALL_BUCKET_CARDS.slice(2, 6).map((b, idx) => (
                  <Link key={`2023-${b.title}-${idx}`} className={styles.bucketCard} href={`/budgets/${b.title.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`}>
                    <div className={styles.cardHeader}><div className={styles.cardTitle}>{b.title}</div><div className={styles.cardSub}>{b.cadence}</div></div>
                    <div className={styles.rowBetween}><span>Total Budget</span><span>${b.total.toLocaleString()}</span></div>
                    <div className={styles.rowBetween}><span>Spent</span><span>${b.spent.toLocaleString()}</span></div>
                    <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${Math.min(100, (b.spent / b.total) * 100)}%`, background: b.barColor }} /></div>
                  </Link>
                ))}
              </div>
            </div>
          )}
       </section>
        <NewBudgetDrawer
          open={showNewBudget}
          onCloseAction={() => setShowNewBudget(false)}
          onCreatedAction={() => {
            // In a real app, refresh data here
          }}
        />
     </div>
   );
 }


