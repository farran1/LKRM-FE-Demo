import { Metadata } from 'next';
import Login from './login'

export const metadata: Metadata = {
  title: "Login | LKRM",
  description: "Login page",
};

export default function() {
  return (
    <Login />
  );
};
