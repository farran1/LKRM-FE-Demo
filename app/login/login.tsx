'use client'

import { Form, Input, Button, ConfigProvider, App } from 'antd'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import style from './style.module.scss'
import Link from 'next/link'
import Logo from '@/components/icon/logo.svg'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/utils/routes'

const Login = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: payload.email,
        password: payload.password,
      })

      if (error) {
        message.error(error.message)
        return
      }

      if (data.user) {
        message.success('Login successful!')
        router.push(ROUTES.dashboard)
      }
    } catch (error) {
      message.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const validateMessages = {
    required: '${label} is required!'
  }

  const goWaitlist = () => {
    router.push('/waitlist')
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

  return (
    <div className={style.container}>
      <div className={style.background}>
        <img src="/imgs/login_bg.jpg" alt="login_bg.jpg" loading="lazy" />
      </div>
      <div className={style.form_wrapper}>
        <div className={style.form}>
          <div className={style.logo}>
            <Logo />
            <div className={style.des}>Login into your account</div>
          </div>
          <ConfigProvider form={{ validateMessages }}>
            <Form onFinish={onSubmit} layout="vertical">
              <Form.Item name="email" rules={[{ required: true }]} label="Email">
                <Input type="email" placeholder="Enter email" />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true }]} label="Password">
                <Input type="password" placeholder="Enter password" />
              </Form.Item>

              <div>
                <Link href="/forgot-password" className={style.forgot_password}>Forgot password?</Link>
                <Button block type="primary" htmlType="submit" style={{ marginBottom: 10 }} loading={loading}>
                  Login
                </Button>
                <div className={style.divider}><span className={style.divider_text}>OR</span></div>
                <Link href="/signup">
                  <Button block>
                    Create Account
                  </Button>
                </Link>
                <Button block onClick={goWaitlist} style={{ marginTop: 10 }}>
                  Join Waitlist
                </Button>
              </div>
            </Form>
          </ConfigProvider>
        </div>
      </div>
    </div>
  )
}

export default Login