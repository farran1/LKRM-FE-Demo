import '../src/styles/globals.scss';
import React from 'react';
import AntdWrapper from '@/components/antd-wrapper';
import { AuthProvider } from '@/components/auth/AuthProvider';

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AntdWrapper>
            {children}
          </AntdWrapper>
        </AuthProvider>
      </body>
    </html>
  )
}
