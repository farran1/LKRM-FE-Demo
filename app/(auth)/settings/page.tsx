'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard since settings is temporarily disabled
    router.replace('/dashboard');
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #17375c 0%, #0f2a44 100%)',
      color: 'white',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Settings Temporarily Unavailable</h1>
        <p style={{ fontSize: '16px', opacity: 0.8 }}>Redirecting to dashboard...</p>
      </div>
    </div>
  );
}