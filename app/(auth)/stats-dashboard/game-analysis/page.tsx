'use client';

import React from 'react';
import { Result, Button } from 'antd';
import { HomeOutlined } from '@ant-design/icons';

export default function GameAnalysisComingSoon() {
  return (
    <main style={{ padding: '0 24px 24px 0', minHeight: '100vh', background: '#202c3e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Result
        status="info"
        title={<span style={{ color: '#fff' }}>Game Analysis</span>}
        subTitle={<span style={{ color: '#b0b0b0' }}>Coming Soon...</span>}
        extra={
          <Button icon={<HomeOutlined />} onClick={() => { if (typeof window !== 'undefined') window.location.href = '/stats-dashboard'; }}>
            Back to Dashboard
          </Button>
        }
        style={{ background: 'rgba(255,255,255,0.03)', padding: 24, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}
      />
    </main>
  );
}



