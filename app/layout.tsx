'use client'
import '../src/styles/globals.scss';
import '../src/msw-init'
import React from 'react';
import AntdWrapper from '@/components/antd-wrapper';

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
