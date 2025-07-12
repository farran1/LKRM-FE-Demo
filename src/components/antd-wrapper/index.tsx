'use client'

import React from 'react';
import {AntdRegistry} from '@ant-design/nextjs-registry';
import {ConfigProvider, App, theme} from 'antd';
import '@/styles/globals.scss';
import AntdPatch from '@/components/patch/antd';
import AppInitializer from '@/components/app-initializer';

export default function AntdWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AntdRegistry>
        <ConfigProvider
          theme={{
            algorithm: theme.darkAlgorithm,
            token: {
              fontFamily: 'var(--font-inter), sans-serif',
              colorPrimary: "#1D75D0",
            },
            components: {
              Input: {
                colorBorder: 'rgba(255,255,255,0.7)',
                colorBgContainer: "rgba(0,0,0,0)",
                controlHeight: 40,
                borderRadius: 12,
              },
              Select: {
                colorBorder: 'rgba(255,255,255,0.7)',
                colorBgContainer: "rgba(0,0,0,0)",
                controlHeight: 40,
                borderRadius: 12,
              },
              Segmented: {
                trackBg: 'rgba(255, 255, 255, 0.1)',
                itemColor: 'rgb(255,255,255)',
                itemSelectedColor: 'rgb(8,26,52)',
                itemSelectedBg: 'rgb(255,255,255)'
              },
              Button: {
                controlHeight: 40,
                // paddingInlineLG: 16,
                paddingInline: 16,
                // paddingInlineSM: 8
                borderRadius: 12,
                fontWeight: 600,
                defaultBg: "rgba(255,255,255,0)",
                defaultHoverBg: "rgba(255,255,255,0)",
                defaultActiveBg: "rgba(255,255,255,0)",
                defaultBorderColor: "rgb(255,255,255)"
              },
              Table: {
                colorBgContainer: "rgba(7, 56, 83, 0.4)",
                borderColor: 'rgba(255, 255, 255, 0.2)',
                fontWeightStrong: 400,
                borderRadius: 10,
                headerBorderRadius: 8
              },
              Pagination: {
                colorBgContainer: "rgb(0,32,50)"
              },
              DatePicker: {
                colorBorder: "rgb(255,255,255)",
                colorBgContainer: "rgba(0,0,0,0)",
                controlHeight: 40,
                borderRadius: 12,
              },
              Card: {
                colorBorderSecondary: "#032A3F",
                colorBgContainer: "#032A3F",
                borderRadius: 12,
              }
            },
          }}
        >
          <App>
            <AppInitializer />
            {children}
          </App>
        </ConfigProvider>
      </AntdRegistry>
      {/* Fix antd v5 compatibility issue with React 19 */}
      <AntdPatch/>
    </>
  )
}