'use client'
import '../src/msw-init'
import React from 'react';
import AntdWrapper from '@/components/antd-wrapper';

// DEV-ONLY: Initialize MSW for API mocking in development mode.
if (process.env.NODE_ENV === 'development') {
  import('../src/mocks/index')
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AntdWrapper>
          {children}
        </AntdWrapper>
      </body>
    </html>
  )
}
