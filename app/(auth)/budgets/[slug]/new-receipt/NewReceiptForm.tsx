'use client';

import React, { useState } from 'react';
import styles from './style.module.scss';
import { message } from 'antd';
import Link from 'next/link';

export default function NewReceiptForm({ slug }: { slug?: string }) {
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('Equipment');
  const [date, setDate] = useState('');
  const [event, setEvent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    message.success('Receipt saved');
    // Redirect back to the previous page if possible; otherwise fallback
    if (typeof window !== 'undefined') {
      const prev = document.referrer;
      const fallback = slug ? `/budgets/${slug}` : '/expenses';
      try {
        if (prev && new URL(prev).origin === window.location.origin) {
          window.location.href = prev;
        } else {
          window.location.href = fallback;
        }
      } catch {
        window.location.href = fallback;
      }
    }
  };

  return (
    <form id="new-receipt-form" className={styles.formGrid} onSubmit={handleSubmit}>
      <div className={styles.uploadPanel}>
        <div className={styles.uploadDrop}
             onClick={() => alert('Mock: open file dialog')}
             role="button"
             tabIndex={0}
        >
          <div className={styles.uploadIcon}>⬆</div>
          <div className={styles.uploadText}>Click to upload or drag and drop your image here<br/>.png, .jpg (Max 5 MB)</div>
        </div>
      </div>
      <div className={styles.detailsPanel}>
        <div className={styles.panelTitle}>Receipt Details</div>
        <p className={styles.panelHint}>Add details manually or upload receipt image and let the OCR extract the fields for you.</p>

      <div className={styles.fieldRow}>
        <label>Merchant Name</label>
        <input value={merchant} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMerchant(e.target.value)} placeholder="ProTools Supply" />
      </div>
      <div className={styles.fieldRow}>
        <label>Amount</label>
        <input value={amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)} placeholder="$450" />
      </div>
      <div className={styles.fieldRow}>
        <label>Category</label>
        <div className={styles.pillRow}>
          {['Equipment','Travel','Maintenance'].map((c) => (
            <button
              key={c}
              type="button"
              className={`${styles.pill} ${category===c?styles.pillActive:''}`}
              onClick={() => setCategory(c)}
            >{c}</button>
          ))}
        </div>
      </div>
      <div className={styles.fieldRow}>
        <label>Date</label>
        <input type="date" value={date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)} />
      </div>
      <div className={styles.fieldRow}>
        <label>Event</label>
        <input value={event} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEvent(e.target.value)} placeholder="Team Workout" />
      </div>
      </div>
    </form>
  );
}


