import { Metadata } from 'next';
import Signup from './signup'

export const metadata: Metadata = {
  title: "Sign Up | LKRM",
  description: "Create your LKRM account",
};

export default function() {
  return (
    <Signup />
  );
};