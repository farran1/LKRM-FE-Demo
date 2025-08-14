import React from 'react';
import styles from './style.module.scss';
import Link from 'next/link';
import NewReceiptForm from './NewReceiptForm';

export default async function NewReceiptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <main className={styles.pageRoot}>
      <div className={styles.headerBar}>
        <div className={styles.backRow}>
          <Link href={`/budgets/${slug}`} className={styles.backLink}>&larr; Back</Link>
          <h1 className={styles.pageTitle}>Add New Transaction</h1>
        </div>
        <button className={styles.primaryBtn} form="new-receipt-form" type="submit">Save</button>
      </div>

      <NewReceiptForm slug={slug} />
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


