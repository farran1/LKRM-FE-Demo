'use client'

import { useEffect, useState } from 'react'
import { Card, Typography, Button, Space, Alert } from 'antd'
import { ReloadOutlined, LogoutOutlined } from '@ant-design/icons'
import { useAuth } from '@/components/auth/AuthProvider'

const { Title, Text, Paragraph } = Typography

interface AuthStatus {
  authenticated: boolean
  user?: {
    id: string
    email: string
    name: string
    metadata: any
    lastSignIn: string
    createdAt: string
  }
  session?: {
    expiresAt: number
    refreshToken: string
  }
  error?: string
}

export default function AuthStatusDebugger() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const { user: authUser, signOut } = useAuth()

  const checkAuthStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/status')
      const data = await response.json()
      setAuthStatus(data)
    } catch (error) {
      console.error('Error checking auth status:', error)
      setAuthStatus({
        authenticated: false,
        error: 'Failed to check authentication status'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      await checkAuthStatus()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <Card title="Authentication Status Debugger" style={{ margin: '20px', maxWidth: '800px' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={checkAuthStatus}
            loading={loading}
          >
            Refresh Status
          </Button>
          <Button 
            danger 
            icon={<LogoutOutlined />} 
            onClick={handleSignOut}
            style={{ marginLeft: '10px' }}
          >
            Sign Out
          </Button>
        </div>

        {authStatus && (
          <>
            <Alert
              type={authStatus.authenticated ? 'success' : 'error'}
              message={authStatus.authenticated ? 'Authenticated' : 'Not Authenticated'}
              description={authStatus.error || 'Authentication status checked successfully'}
            />

            {authStatus.authenticated && authStatus.user && (
              <Card title="User Information" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Name: </Text>
                    <Text>{authStatus.user.name}</Text>
                  </div>
                  <div>
                    <Text strong>Email: </Text>
                    <Text>{authStatus.user.email}</Text>
                  </div>
                  <div>
                    <Text strong>User ID: </Text>
                    <Text code>{authStatus.user.id}</Text>
                  </div>
                  <div>
                    <Text strong>Last Sign In: </Text>
                    <Text>{new Date(authStatus.user.lastSignIn).toLocaleString()}</Text>
                  </div>
                  <div>
                    <Text strong>Created At: </Text>
                    <Text>{new Date(authStatus.user.createdAt).toLocaleString()}</Text>
                  </div>
                  <div>
                    <Text strong>Metadata: </Text>
                    <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                      {JSON.stringify(authStatus.user.metadata, null, 2)}
                    </pre>
                  </div>
                </Space>
              </Card>
            )}

            {authStatus.session && (
              <Card title="Session Information" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Expires At: </Text>
                    <Text>{new Date(authStatus.session.expiresAt * 1000).toLocaleString()}</Text>
                  </div>
                  <div>
                    <Text strong>Refresh Token: </Text>
                    <Text>{authStatus.session.refreshToken}</Text>
                  </div>
                </Space>
              </Card>
            )}

            <Card title="AuthProvider Context" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>AuthProvider User: </Text>
                  <Text>{authUser ? 'Present' : 'Null'}</Text>
                </div>
                {authUser && (
                  <>
                    <div>
                      <Text strong>Email: </Text>
                      <Text>{authUser.email}</Text>
                    </div>
                    <div>
                      <Text strong>ID: </Text>
                      <Text code>{authUser.id}</Text>
                    </div>
                    <div>
                      <Text strong>Metadata: </Text>
                      <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                        {JSON.stringify(authUser.user_metadata, null, 2)}
                      </pre>
                    </div>
                  </>
                )}
              </Space>
            </Card>
          </>
        )}
      </Space>
    </Card>
  )
}
