'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { Layout, Menu, theme, Breadcrumb, Tooltip } from 'antd'
import { usePathname, useRouter } from 'next/navigation'
import { ROUTES } from '@/utils/routes'
import Logo from '@/components/icon/logo_small.svg'
import style from './style.module.scss'
import RightHeader from '@/components/right-header'
import { SWRConfig } from 'swr'
import { fetcher } from '@/services/api'
// DEV-ONLY: Changed from alias import to relative path to fix module not found error in dev mode. Revert to alias if project structure changes back.
import { menus } from '../../utils/menu'
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';

const { Header, Sider, Content, Footer } = Layout

interface MainLayoutProps {
  children: React.ReactNode
}



const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sidebar-collapsed');
      if (stored === 'true') setCollapsed(true);
    }
  }, []);
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

  const handleCollapse = (value: boolean) => {
    setCollapsed(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', value ? 'true' : 'false');
    }
  };

  return (
    <SWRConfig value={{
      fetcher,
      shouldRetryOnError: false,
      refreshInterval: 0,
      dedupingInterval: 2000,
      revalidateOnFocus: true
    }}>
      <Layout className={style.layout}>
        <Sider
          theme="dark"
          trigger={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 48 }}>
              <span
                style={{ cursor: 'pointer', fontSize: 20, color: '#bfc9d1' }}
                onClick={() => handleCollapse(!collapsed)}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </span>
            </div>
          }
          collapsible
          collapsed={collapsed}
          onCollapse={handleCollapse}
          width={212}
          collapsedWidth={56}
          breakpoint="md"
        >
          {!collapsed && (
            <div className={style.logo}>
              <Logo />
            </div>
          )}
          {collapsed ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginTop: 72 }}>
              {menus.map((section) => (
                <div key={section.key} style={{ width: '100%' }}>
                  {section.children && section.children.map((item) => (
                    <Tooltip key={item.key} title={item.label.props ? item.label.props.children : item.label} placement="right">
                      <span style={{ 
                        width: item.key === '/dashboard' ? '45px' : '38px',
                        height: item.key === '/dashboard' ? '45px' : '38px',
                        color: item.key === '/dashboard' ? '#B58842' : '#fff', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        margin: '10px 7px'
                      }}>
                        {item.icon}
                      </span>
                    </Tooltip>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: 4 }}>
              {menus.map((section) => (
                <div key={section.key} style={{ marginBottom: 2 }}>
                  <div style={{ color: '#bfc9d1', fontWeight: 600, fontSize: 15, margin: '8px 0 4px 18px', letterSpacing: 0.5, display: 'flex', alignItems: 'center', textDecoration: 'underline' }}>
                    {section.icon && section.icon !== null && <span style={{ marginRight: 8, width: '30px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{section.icon}</span>}
                    {section.label}
                  </div>
                  {section.children && section.children.map((item) => (
                    <div
                      key={item.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '6px 18px',
                        color: item.key === '/dashboard' ? '#B58842' : '#fff',
                        fontSize: 16,
                        borderRadius: 8,
                        margin: '2px 0',
                        background: selectedKey === item.key ? 'rgba(24, 144, 255, 0.2)' : 'transparent',
                        cursor: 'pointer',
                        fontWeight: item.key === '/dashboard' ? 700 : (selectedKey === item.key ? 600 : 400),
                      }}
                      onClick={() => router.push(item.key)}
                    >
                      {item.icon && <span style={{ 
                        marginRight: 10, 
                        fontSize: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px'
                      }}>{item.icon}</span>}
                      {item.label.props ? item.label.props.children : item.label}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </Sider>
        <Layout className={style.main}>
          <Header
            style={{
              width: collapsed ? '100%' : 'calc(100% - 212px)',
              left: collapsed ? 0 : 212,
              transition: 'width 0.2s, left 0.2s',
              position: 'fixed',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              // ...other header styles as needed
            }}
          >
            {collapsed && (
              <div style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 44, marginTop: 12 }}>
                <Logo />
              </div>
            )}
            {/* ...rest of your header content... */}
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