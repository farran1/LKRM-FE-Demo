import React from 'react';
import ExpensesChart from './ExpensesChart';
import Link from 'next/link';
import styles from './style.module.scss';

type BucketDetails = {
  title: string;
  cadence: string;
  total: number;
  expenses: number;
  description: string;
  transactions: Array<{
    id: string;
    receiptThumb?: string;
    merchant: string;
    amount: number;
    category: string;
    date: string;
    event: string;
  }>
}

const SAMPLE_BUCKETS: Record<string, BucketDetails> = {
  'equipment-maintenance': {
    title: 'Equipment Maintenance',
    cadence: 'Quarterly (Jan - March)',
    total: 10200,
    expenses: 7900,
    description:
      'This budget is allocated for the regular maintenance, repair, and replacement of team equipment throughout the season. It covers expenses such as routine servicing of training gear, replacement of damaged equipment, and purchasing new tools to ensure peak performance and player safety.',
    transactions: [
      { id: 't1', merchant: 'ProTools Supply', amount: 450, category: 'Equipment', date: 'Feb 12, 2025', event: 'Team Workout' },
      { id: 't2', merchant: 'GearFix Co.', amount: 320, category: 'Equipment', date: 'Feb 09, 2025', event: 'Weekly Practice' },
      { id: 't3', merchant: 'LockerRoom LLC', amount: 185, category: 'Supplies', date: 'Jan 30, 2025', event: 'Preseason' },
    ],
  },
  'food-drink': {
    title: 'Food & Drink',
    cadence: 'Monthly (Feb 2025)',
    total: 5000,
    expenses: 4200,
    description:
      'Covers meals, snacks, and hydration for players and staff across games, practices, and events. Focused on fueling performance and recovery.',
    transactions: [
      { id: 't4', merchant: 'PowerFuel Catering', amount: 900, category: 'Catering', date: 'Feb 10, 2025', event: 'Home Game' },
      { id: 't5', merchant: 'Hydrate+ Water', amount: 210, category: 'Beverages', date: 'Feb 06, 2025', event: 'Practice' },
    ],
  },
  'tournament-league-fees': {
    title: 'Tournament & League Fees',
    cadence: 'Yearly (2025)',
    total: 25000,
    expenses: 25500,
    description:
      'Registration fees and league dues for tournaments and seasonal play. Includes sanctioning and administrative costs.',
    transactions: [
      { id: 't6', merchant: 'National League', amount: 12500, category: 'Fees', date: 'Jan 02, 2025', event: 'Season Registration' },
      { id: 't7', merchant: 'Spring Classic', amount: 13000, category: 'Fees', date: 'Feb 14, 2025', event: 'Tournament' },
    ],
  },
};

function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

export default function BucketDetailsPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  const data: BucketDetails | undefined = SAMPLE_BUCKETS[slug];

  if (!data) {
    const fallbackTitle = slugToTitle(slug);
    return (
      <main className={styles.detailsRoot}>
        <div className={styles.headerBar}>
          <div className={styles.backRow}>
            <Link href="/budgets" className={styles.backLink}>&larr; Back</Link>
            <h1 className={styles.pageTitle}>Budget / {fallbackTitle}</h1>
          </div>
        </div>
        <div className={styles.detailsGrid}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryHead}>
              <div className={styles.summaryTitle}>{fallbackTitle}</div>
              <div className={styles.summaryCadence}>Budget</div>
            </div>
            <p className={styles.description}>No configured data for this bucket yet.</p>
          </div>
        </div>
      </main>
    );
  }

  const remaining = Math.max(0, data.total - data.expenses);
  const expensesPct = Math.min(100, (data.expenses / data.total) * 100);
  const remainingPct = Math.min(100, (remaining / data.total) * 100);

  return (
    <main className={styles.detailsRoot}>
      <div className={styles.headerBar}>
        <div className={styles.backRow}>
          <Link href="/budgets" className={styles.backLink}>&larr; Back</Link>
          <h1 className={styles.pageTitle}>Budget / {data.title}</h1>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.primaryBtn}>Export Report</button>
        </div>
      </div>

      <div className={styles.detailsGrid}>
        {/* Left: Summary */}
        <section className={styles.summaryCard}>
          <div className={styles.summaryHead}>
            <div className={styles.summaryTitle}>{data.title}</div>
            <div className={styles.summaryCadence}>{data.cadence}</div>
          </div>
          <p className={styles.description}>{data.description}</p>

          <div className={styles.rowBetweenLg}>
            <span>Total Budget</span>
            <strong>${data.total.toLocaleString()}</strong>
          </div>
          <div className={styles.rowBetweenSm}>
            <span>Expenses</span>
            <span>${data.expenses.toLocaleString()}</span>
          </div>
          <div className={styles.progressTrackMuted}><div className={styles.progressFillOrange} style={{ width: `${Math.round(522 * (expensesPct/100))}px` }} /></div>
          <div className={styles.rowBetweenSm}>
            <span>Budget Remaining</span>
            <span>${remaining.toLocaleString()}</span>
          </div>
          <div className={styles.progressTrackMuted}><div className={styles.progressFillWhite} style={{ width: `${Math.round(522 * (remainingPct/100))}px` }} /></div>

          <div className={styles.notesSection}>
            <div className={styles.sectionTitle}>Notes</div>
            <div className={styles.noteCard}>Prioritize essential repairs before new purchases.</div>
            <div className={styles.noteCard}>Track vendor SLAs to reduce downtime.</div>
          </div>
        </section>

        {/* Right: Expenses chart */}
        <section className={styles.expensesPanel}>
          <div className={styles.sectionTitle}>Expenses</div>
          <div className={styles.rangeTabs}>
            <button className={styles.tabInactive}>Week</button>
            <button className={styles.tabActive}>Month</button>
            <button className={styles.tabInactive}>Lifetime</button>
          </div>
          <div className={styles.graphBox}>
            <ExpensesChart />
          </div>
          <div className={styles.legendRow}>
            <span className={styles.legendDotOrange} /> Expenses
            <span className={styles.legendDotWhite} /> Budget Remaining
          </div>
        </section>
      </div>

      {/* Transactions (full width) */}
      <section className={styles.transactionsCard}>
        <div className={styles.headerRow}>
          <div className={styles.sectionTitle}>Transactions</div>
          <Link className={styles.ghostBtn} href={`/budgets/${slug}/new-receipt`}>
            Add New Transaction
          </Link>
        </div>
        <div className={styles.tableContainer}>
          <div className={`${styles.tableRow} ${styles.tableHeader}`}>
            <div>Receipt</div>
            <div>Merchant Name</div>
            <div>Amount</div>
            <div>Category</div>
            <div>Date</div>
            <div>Event</div>
            <div className={styles.actionsCol}>Actions</div>
          </div>
          {data.transactions.map((t) => {
            const [left, right] = t.date.includes(',') ? t.date.split(',') : [t.date, ''];
            return (
              <div key={t.id} className={styles.tableRow}>
                <div className={styles.receiptCell}>New Tools Purchase</div>
                <div>{t.merchant}</div>
                <div>${t.amount.toLocaleString()}</div>
                <div><span className={styles.chipGreen}>{t.category}</span></div>
                <div><div>{left.trim()},</div><div>{right.trim()}</div></div>
                <div className={styles.linkText}>{t.event}</div>
                <div className={styles.actionsCol}><button className={styles.ghostBtn}>View Receipt</button></div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export async function generateStaticParams() {
  return [
    { slug: 'equipment-maintenance' },
    { slug: 'food-drink' },
    { slug: 'tournament-league-fees' },
    { slug: 'travel-transportation' },
    { slug: 'coaching-staff-training' },
    { slug: 'equipment-uniforms' },
    { slug: 'technology-licenses' },
  ];
}


