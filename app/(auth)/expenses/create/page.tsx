import { Metadata } from 'next';
import CreateExpense from './create-expense'
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: "Create Expense | LKRM",
  description: "Create new expense",
};

export default function() {
  return (
    <Suspense>
      <CreateExpense />
    </Suspense>
  );
}
