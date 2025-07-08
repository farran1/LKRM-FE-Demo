import { Metadata } from 'next';
import Page from './new-player'
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: "Players | LKRM",
  description: "Players page",
};

export default function() {
  return (
    <Suspense>
      <Page />
    </Suspense>
  );
}
