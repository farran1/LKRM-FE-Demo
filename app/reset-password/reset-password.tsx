'use client'

import { Form, Input, Button, ConfigProvider, App } from 'antd'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import style from './style.module.scss'
import Link from 'next/link'
import Logo from '@/components/icon/logo.svg'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/utils/routes'

const ResetPassword = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [passwordReset, setPasswordReset] = useState(false)
  const { message } = App.useApp()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        // Check if we have the necessary tokens for password reset
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        
        if (!session && !accessToken) {
          message.error('Invalid or expired reset link')
          router.push('/forgot-password')
          return
        }
        
        // If we have tokens in URL, set the session
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (error) {
            message.error('Invalid or expired reset link')
            router.push('/forgot-password')
            return
          }
        }
      } catch (error) {
        console.error('Error checking session:', error)
        message.error('An error occurred while verifying your reset link')
        router.push('/forgot-password')
      } finally {
        setCheckingSession(false)
      }
    }

    checkSession()
  }, [router, searchParams, message])

  const onSubmit = async (payload: any) => {
    if (payload.password !== payload.confirmPassword) {
      message.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: payload.password
      })

      if (error) {
        message.error(error.message)
        return
      }

      setPasswordReset(true)
      message.success('Password updated successfully!')
    } catch (error) {
      message.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const validateMessages = {
    required: '${label} is required!'
  }

  // Show loading while checking session
  if (checkingSession) {
    return (
      <div className={style.container}>
        <div className={style.background}>
          <img src="/imgs/login_bg.jpg" alt="login_bg.jpg" loading="lazy" />
        </div>
        <div className={style.form_wrapper}>
          <div className={style.form}>
            <div className={style.logo}>
              <Logo />
              <div className={style.des}>Verifying reset link...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (passwordReset) {
    return (
      <div className={style.container}>
        <div className={style.background}>
          <img src="/imgs/login_bg.jpg" alt="login_bg.jpg" loading="lazy" />
        </div>
        <div className={style.form_wrapper}>
          <div className={style.form}>
            <div className={style.logo}>
              <Logo />
              <div className={style.des}>Password updated!</div>
            </div>
            <div className={style.success_message}>
              <p>Your password has been successfully updated.</p>
              <p>You can now log in with your new password.</p>
            </div>
            <div className={style.actions}>
              <Link href="/login">
                <Button block type="primary">
                  Go to Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={style.container}>
      <div className={style.background}>
        <img src="/imgs/login_bg.jpg" alt="login_bg.jpg" loading="lazy" />
      </div>
      <div className={style.form_wrapper}>
        <div className={style.form}>
          <div className={style.logo}>
            <Logo />
            <div className={style.des}>Set new password</div>
          </div>
          <ConfigProvider form={{ validateMessages }}>
            <Form onFinish={onSubmit} layout="vertical">
              <Form.Item 
                name="password" 
                rules={[{ required: true, min: 6 }]} 
                label="New Password"
              >
                <Input.Password placeholder="Enter new password (min 6 characters)" />
              </Form.Item>
              <Form.Item 
                name="confirmPassword" 
                rules={[{ required: true }]} 
                label="Confirm New Password"
              >
                <Input.Password placeholder="Confirm new password" />
              </Form.Item>

              <div>
                <Button block type="primary" htmlType="submit" style={{ marginBottom: 10 }} loading={loading}>
                  Update Password
                </Button>
                <div className={style.divider}><span className={style.divider_text}>OR</span></div>
                <Link href="/login">
                  <Button block>
                    Back to Login
                  </Button>
                </Link>
              </div>
            </Form>
          </ConfigProvider>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword





