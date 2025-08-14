'use client';

import React, { useMemo, useState } from 'react';
import styles from './drawer.module.scss';

type Period = 'Monthly' | 'Quarterly' | 'Yearly' | 'Custom';

interface NewBudgetDrawerProps {
  open: boolean;
  onCloseAction: () => void;
  onCreatedAction?: (payload: {
    name: string;
    amount: number;
    period: Period;
    autoRepeat: 'Yes' | 'No';
    description: string;
    notes: string[];
  }) => void;
}

export default function NewBudgetDrawer({ open, onCloseAction, onCreatedAction }: NewBudgetDrawerProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<Period>('Yearly');
  const [autoRepeat, setAutoRepeat] = useState<'Yes' | 'No'>('Yes');
  const [description, setDescription] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [notes, setNotes] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  // Custom period popup
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customPeriodText, setCustomPeriodText] = useState('');

  const slug = useMemo(
    () => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    [name]
  );

  function onAddNote() {
    if (!noteDraft.trim()) return;
    setNotes((prev) => [noteDraft.trim(), ...prev]);
    setNoteDraft('');
  }

  function onDeleteNote(index: number) {
    setNotes((prev) => prev.filter((_, i) => i !== index));
  }

  function onEditNote(index: number) {
    setEditingIndex(index);
    setEditingText(notes[index]);
  }

  function onSaveEdit() {
    if (editingIndex === null) return;
    const next = [...notes];
    next[editingIndex] = editingText.trim();
    setNotes(next);
    setEditingIndex(null);
    setEditingText('');
  }

  function onCancelEdit() {
    setEditingIndex(null);
    setEditingText('');
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload = {
      name,
      amount: Number(amount || 0),
      period,
      autoRepeat,
      description,
      notes,
    };
    // eslint-disable-next-line no-console
    console.log('Create Budget', payload, { slug });
    onCreatedAction?.(payload);
    onCloseAction();
  }

  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Create New Budget">
      <div className={styles.rightPanel}>
        <div className={styles.panelHeader}> 
          <h1 className={styles.title}>New Budget</h1>
          <button className={styles.closeBtn} onClick={onCloseAction} aria-label="Close">×</button>
        </div>

        <form id="new-budget-form" className={styles.formRoot} onSubmit={onSubmit}>
          <section className={`${styles.section} ${styles.sectionFirst}`}>
            <h2 className={styles.sectionTitle}>Budget Details</h2>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Budget Name</label>
              <div className={styles.inputBox}>
                <input
                  className={styles.inputText}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Budget Name"
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Budget Amount</label>
              <div className={styles.inputBox}>
                <input
                  className={styles.inputText}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="$10,000"
                  inputMode="decimal"
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.subLabel}>Budget Period</div>
              <div className={styles.pillRow}>
                {(['Monthly', 'Quarterly', 'Yearly'] as Period[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={p === period ? styles.pillSelected : styles.pill}
                    onClick={() => setPeriod(p)}
                    aria-pressed={p === period}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  className={period === 'Custom' ? styles.pillSelected : styles.pill}
                  onClick={() => { setPeriod('Custom'); setShowCustomModal(true); }}
                  aria-pressed={period === 'Custom'}
                >
                  Custom
                </button>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.subLabel}>Repeat this budget automatically for the next period?</div>
              <div className={styles.pillRow}>
                {(['Yes', 'No'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={opt === autoRepeat ? styles.pillSelected : styles.pill}
                    onClick={() => setAutoRepeat(opt)}
                    aria-pressed={opt === autoRepeat}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.subLabel}>Budget Description</div>
              <div className={styles.textareaBox}>
                <textarea
                  className={styles.textarea}
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add description"
                />
              </div>
            </div>
          </section>

          <section className={`${styles.section} ${styles.sectionNotes}`}>
            <div className={styles.notesHeader}>
              <div className={styles.subLabel}>Notes</div>
              <button type="button" className={styles.addBtn} onClick={onAddNote}>Add</button>
            </div>

            <div className={styles.notesInputBox}>
              <textarea
                className={styles.textarea}
                rows={5}
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Add Note here"
              />
            </div>

            {notes.length > 0 && (
              <div>
                {notes.map((n, idx) => (
                  <div key={`${idx}-${n.slice(0,20)}`} className={styles.noteCard}>
                    {editingIndex === idx ? (
                      <div className={styles.editRow}>
                        <textarea
                          className={styles.textarea}
                          rows={3}
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                        />
                        <div className={styles.noteActions}>
                          <button type="button" className={styles.primaryBtn} onClick={onSaveEdit}>Save</button>
                          <button type="button" className={styles.ghostBtn} onClick={onCancelEdit}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className={styles.noteText}>{n}</p>
                        <div className={styles.noteActions}>
                          <button type="button" className={styles.iconBtn} aria-label="Edit" onClick={() => onEditNote(idx)}>✏️</button>
                          <button type="button" className={styles.iconBtn} aria-label="Delete" onClick={() => onDeleteNote(idx)}>🗑</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {showCustomModal && (
              <div className={styles.modalBackdrop}>
                <div className={styles.modalCard} role="dialog" aria-modal="true" aria-label="Custom period">
                  <div className={styles.modalTitle}>Custom Period</div>
                  <div className={styles.inputBox}>
                    <input
                      className={styles.inputText}
                      value={customPeriodText}
                      onChange={(e) => setCustomPeriodText(e.target.value)}
                      placeholder="e.g., Jan 10 - Mar 31"
                    />
                  </div>
                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      className={styles.ghostBtn}
                      onClick={() => { setShowCustomModal(false); if (period !== 'Custom') setPeriod('Custom'); }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      onClick={() => { setShowCustomModal(false); /* Keep customPeriodText for submission */ }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          <div className={styles.footerBar}>
            <button type="submit" className={styles.primaryBtn}>Create New Budget</button>
          </div>
        </form>
      </div>
    </div>
  );
}


