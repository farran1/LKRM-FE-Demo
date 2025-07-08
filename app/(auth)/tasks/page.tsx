import { Metadata } from 'next';
import Page from './task'
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: "Tasks | LKRM",
  description: "Tasks page",
};

export default function() {
  return (
    <Suspense>
      <Page />
    </Suspense>
  );
}
