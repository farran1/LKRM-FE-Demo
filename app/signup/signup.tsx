'use client'

import { Form, Input, Button, ConfigProvider, App } from 'antd'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import style from '../login/style.module.scss'
import Link from 'next/link'
import Logo from '@/components/icon/logo.svg'
import { supabase } from '@/lib/supabase'

const Signup = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { message } = App.useApp()

  const onSubmit = async (payload: any) => {
    if (payload.password !== payload.confirmPassword) {
      message.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          data: {
            first_name: payload.firstName,
            last_name: payload.lastName,
            institute: payload.institute
          }
        }
      })

      if (error) {
        message.error(error.message)
        return
      }

      if (data.user) {
        message.success('Account created successfully! Please check your email to verify your account.')
        router.push('/login')
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

  // Force enable scrolling on this page
  useEffect(() => {
    document.body.style.overflow = 'auto'
    return () => {
      document.body.style.overflow = 'hidden'
    }
  }, [])

  return (
    <div className={style.container} style={{ overflow: 'auto' }}>
      <div className={style.background}>
        <img src="/imgs/login_bg.jpg" alt="login_bg.jpg" loading="lazy" />
      </div>
      <div className={style.form_wrapper} style={{ overflow: 'auto' }}>
        <div className={style.form}>
          <div className={style.logo}>
            <Logo />
            <div className={style.des}>Create your LKRM account</div>
          </div>
          <ConfigProvider form={{ validateMessages }}>
            <Form onFinish={onSubmit} layout="vertical">
              <Form.Item name="firstName" rules={[{ required: true }]} label="First Name">
                <Input placeholder="Enter first name" />
              </Form.Item>
              <Form.Item name="lastName" rules={[{ required: true }]} label="Last Name">
                <Input placeholder="Enter last name" />
              </Form.Item>
              <Form.Item name="institute" rules={[{ required: true }]} label="School/Institute">
                <Input placeholder="Enter school or institute name" />
              </Form.Item>
              <Form.Item name="email" rules={[{ required: true, type: 'email' }]} label="Email">
                <Input type="email" placeholder="Enter email" />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, min: 6 }]} label="Password">
                <Input.Password placeholder="Enter password (min 6 characters)" />
              </Form.Item>
              <Form.Item name="confirmPassword" rules={[{ required: true }]} label="Confirm Password">
                <Input.Password placeholder="Confirm password" />
              </Form.Item>

              <div>
                <Button block type="primary" htmlType="submit" style={{ marginBottom: 10 }} loading={loading}>
                  Create Account
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

export default Signup