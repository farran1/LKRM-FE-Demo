'use client'

import { Form, Input, Button, ConfigProvider, App } from 'antd'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import style from './style.module.scss'
import Link from 'next/link'
import Logo from '@/components/icon/logo.svg'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/utils/routes'

const ForgotPassword = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [emailSent, setEmailSent] = useState(false)
  const { message } = App.useApp()

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          // User is already logged in, redirect to dashboard
          router.push(ROUTES.dashboard)
          return
        }
      } catch (error) {
        console.error('Error checking auth status:', error)
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  const onSubmit = async (payload: any) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(payload.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        message.error(error.message)
        return
      }

      setEmailSent(true)
      message.success('Password reset email sent! Check your inbox.')
    } catch (error) {
      message.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const validateMessages = {
    required: '${label} is required!'
  }

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className={style.container}>
        <div className={style.background}>
          <img src="/imgs/login_bg.jpg" alt="login_bg.jpg" loading="lazy" />
        </div>
        <div className={style.form_wrapper}>
          <div className={style.form}>
            <div className={style.logo}>
              <Logo />
              <div className={style.des}>Checking authentication...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (emailSent) {
    return (
      <div className={style.container}>
        <div className={style.background}>
          <img src="/imgs/login_bg.jpg" alt="login_bg.jpg" loading="lazy" />
        </div>
        <div className={style.form_wrapper}>
          <div className={style.form}>
            <div className={style.logo}>
              <Logo />
              <div className={style.des}>Check your email</div>
            </div>
            <div className={style.success_message}>
              <p>We've sent you a password reset link.</p>
              <p>Please check your email and click the link to reset your password.</p>
            </div>
            <div className={style.actions}>
              <Link href="/login">
                <Button block type="primary">
                  Back to Login
                </Button>
              </Link>
              <Button 
                block 
                onClick={() => setEmailSent(false)}
                style={{ marginTop: 10 }}
              >
                Send Another Email
              </Button>
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
            <div className={style.des}>Reset your password</div>
          </div>
          <ConfigProvider form={{ validateMessages }}>
            <Form onFinish={onSubmit} layout="vertical">
              <Form.Item name="email" rules={[{ required: true, type: 'email' }]} label="Email">
                <Input type="email" placeholder="Enter your email address" />
              </Form.Item>

              <div>
                <Button block type="primary" htmlType="submit" style={{ marginBottom: 10 }} loading={loading}>
                  Send Reset Link
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

export default ForgotPassword





