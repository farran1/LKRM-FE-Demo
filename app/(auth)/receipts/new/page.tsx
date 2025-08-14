import React from 'react';
import styles from '../../budgets/[slug]/new-receipt/style.module.scss';
import NewReceiptForm from '../../budgets/[slug]/new-receipt/NewReceiptForm';
import Link from 'next/link';

export default function NewReceiptStandalone() {
  return (
    <main className={styles.pageRoot}>
      <div className={styles.headerBar}>
        <div className={styles.backRow}>
          <Link href="/expenses" className={styles.backLink}>&larr; Back</Link>
          <h1 className={styles.pageTitle}>Add New Transaction</h1>
        </div>
        <button className={styles.primaryBtn} form="new-receipt-form" type="submit">Save</button>
      </div>

      <NewReceiptForm />
    </main>
  );
}


