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
import { menus } from '@/utils/menu'
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { useAuth } from '@/components/auth/AuthProvider'
import { Spin } from 'antd'
import { useIsClient } from '@/hooks/useClientSide'

const { Header, Sider, Content, Footer } = Layout

interface MainLayoutProps {
  children: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // ALL HOOKS MUST BE AT THE TOP - before any conditional logic
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()
  const [collapsed, setCollapsed] = useState(false);
  const isClient = useIsClient();

  // Helper function for breadcrumbs (MUST be defined before useMemo)
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

  // Calculate breadcrumb items using useMemo (must be before any early returns)
  const breadcrumbItems = useMemo(() => {
    const pathWithoutQuery = pathname.split('?')[0];
    const cleanPath = pathWithoutQuery
    const breadcrumbs = findBreadcrumb(cleanPath, menus).map((item, index, array) => ({
      path: index === array.length - 1 ? pathname : '#',
      label: item.label,
      icon: item.icon,
    }));

    return breadcrumbs;
  }, [pathname]);

  // Calculate selected key (must be before any early returns)
  const selectedKey: string = pathname === '/' ? ROUTES.dashboard : pathname;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Initialize collapsed state from localStorage (client-only)
  useEffect(() => {
    if (isClient) {
      const stored = localStorage.getItem('sidebar-collapsed');
      if (stored === 'true') setCollapsed(true);
    }
  }, [isClient]);

  // Listen for custom sidebar toggle events from other components
  useEffect(() => {
    if (!isClient) return;

    const handleSidebarToggle = () => {
      const stored = localStorage.getItem('sidebar-collapsed');
      setCollapsed(stored === 'true');
    };

    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    
    return () => {
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
    };
  }, [isClient]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#202c3e'
      }}>
        <Spin size="large" />
      </div>
    )
  }

  // Don't render if not authenticated
  if (!user) {
    return null
  }

  const handleCollapse = (value: boolean) => {
    setCollapsed(value);
    if (isClient) {
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
          className="main-layout-sider"
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
                      <span
                        onClick={() => router.push(item.key)}
                        role="button"
                        tabIndex={0}
                        aria-label={item.label.props ? item.label.props.children : item.label}
                        style={{ 
                          width: item.key === '/dashboard' ? '45px' : '38px',
                          height: item.key === '/dashboard' ? '45px' : '38px',
                          color: item.key === '/dashboard' ? '#B58842' : '#fff', 
                          cursor: 'pointer', 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center', 
                          margin: '10px 7px'
                        }}
                      >
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
            className="main-layout-header"
            style={{
              width: collapsed ? '100%' : 'calc(100% - 212px)',
              left: collapsed ? 0 : 212,
              transition: 'width 0.2s, left 0.2s',
              position: 'fixed',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              top: 0,
            }}
          >
            {collapsed && (
              <div style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 44, marginTop: 12 }}>
                <Logo />
              </div>
            )}
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