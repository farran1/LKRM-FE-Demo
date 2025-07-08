'use client'

import React, { useMemo, useState } from 'react'
import { Layout, Menu, theme, Breadcrumb } from 'antd'
import { usePathname, useRouter } from 'next/navigation'
import { ROUTES } from '@/utils/routes'
import Logo from '@/components/icon/logo_small.svg'
import style from './style.module.scss'
import RightHeader from '@/components/right-header'
import { SWRConfig } from 'swr'
import { fetcher } from '@/services/api'
import { menus } from '@/utils/menu'

const { Header, Sider, Content, Footer } = Layout

interface MainLayoutProps {
  children: React.ReactNode
}



const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()
  const selectedKey: string = pathname === '/' ? ROUTES.planner.event : pathname;

  const findBreadcrumb = (key: string, items: any[]): { label: string; icon?: React.ReactNode }[] => {
    for (const item of items) {
      if (key === item.key || key.startsWith(item.key)) return [{label: item.label, icon: item.icon}];
      if (item.children) {
        const found = findBreadcrumb(key, item.children);
        if (found.length) return [{label: item.label, icon: item.icon}, ...found];
      }
    }
    return [];
  };

  const breadcrumbItems = useMemo(() => {
    const pathWithoutQuery = pathname.split('?')[0]; // Loại bỏ query string
    // const cleanPath = pathWithoutQuery.replace(/\/(create)$/, '');
    // console.log('cleanPath ', cleanPath)
    const cleanPath = pathWithoutQuery
    const breadcrumbs = findBreadcrumb(cleanPath, menus).map((item, index, array) => ({
      path: index === array.length - 1 ? pathname : '#',
      label: item.label,
      icon: item.icon,
    }));

    return breadcrumbs;
  }, [pathname]);

  return (
    <SWRConfig value={{
      fetcher,
      shouldRetryOnError: false,
      refreshInterval: 0,
      dedupingInterval: 2000,
      revalidateOnFocus: true
    }}>
      <Layout className={style.layout}>
        <Sider theme="dark" trigger={null} collapsible width={212} breakpoint="md" collapsedWidth="0">
          <div className={style.logo}>
            <Logo />
          </div>
          <Menu
            className={style.menu}
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menus}
            openKeys={['planner', 'team', 'finance']}
          />
        </Sider>
        <Layout className={style.main}>
          <Header>
            <Breadcrumb
              separator='/'
              items={breadcrumbItems.map((item) => ({
                title: (
                  <div style={{display: 'flex', alignItems: 'center'}}>
                    <span className={style.menuLabel}>{item.label}</span>
                  </div>
                ),
              }))}/>
            <RightHeader />
            {/* <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            /> */}
          </Header>
          <Content>
            {children}
          </Content>
        </Layout>
      </Layout>
    </SWRConfig>
  )
}

export default MainLayout 