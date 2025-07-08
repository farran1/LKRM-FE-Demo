import { Metadata } from 'next';
import Page from './event'
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: "Events | LKRM",
  description: "Events page",
};

export default function() {
  return (
    <Suspense>
      <Page />
    </Suspense>
  );
}
