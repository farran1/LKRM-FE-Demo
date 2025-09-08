import { Metadata } from 'next';
import ExpenseDetail from './expense-detail'
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: "Expense Detail | LKRM",
  description: "Expense details",
};

export default async function({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <ExpenseDetail expenseId={id} />
    </Suspense>
  );
}
