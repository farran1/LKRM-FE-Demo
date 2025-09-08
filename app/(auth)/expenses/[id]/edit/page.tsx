import { Metadata } from 'next';
import EditExpense from './edit-expense'
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: "Edit Expense | LKRM",
  description: "Edit expense",
};

export default async function({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <EditExpense expenseId={id} />
    </Suspense>
  );
}
