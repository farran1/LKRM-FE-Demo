import { Metadata } from 'next';
import Page from './import'
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: "Import Bulk Players | LKRM",
  description: "Import Bulk Players page",
};

export default function() {
  return (
    <Suspense>
      <Page />
    </Suspense>
  );
}
