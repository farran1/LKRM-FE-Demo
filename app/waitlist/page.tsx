import { Metadata } from 'next';
import Page from './waitlist'

export const metadata: Metadata = {
  title: "Waitlist | LKRM",
  description: "Waitlist page",
};

export default function() {
  return (
    <Page />
  );
};
