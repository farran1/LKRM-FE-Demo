import { Metadata } from 'next';
import Page from './expense'
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: "Expenses | LKRM",
  description: "Expenses page",
};

export default function() {
  return (
    <Suspense>
      <Page />
    </Suspense>
  );
}


