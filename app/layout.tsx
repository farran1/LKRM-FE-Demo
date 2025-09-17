import '../src/styles/globals.scss';
import React from 'react';
import AntdWrapper from '@/components/antd-wrapper';
import { AuthProvider } from '@/components/auth/AuthProvider';

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <title>LKRM Basketball Analytics</title>
        <meta name="description" content="Basketball team management and analytics platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
      </head>
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
