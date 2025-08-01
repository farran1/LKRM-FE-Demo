import React from 'react';

export default function FundsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1b2736 0%, #23272f 100%)' }}>
      {children}
    </div>
  );
} 