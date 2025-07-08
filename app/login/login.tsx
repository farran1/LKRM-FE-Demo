'use client'

import { Form, Input, Button, Card, ConfigProvider, Row, Checkbox, Flex, App } from 'antd'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import style from './style.module.scss'
import Link from 'next/link'
import Logo from '@/components/icon/logo.svg'
import api from '@/services/api'
import useAppStore from '@/store/app'
import { ROUTES } from '@/utils/routes'

const Login = () => {
  const router = useRouter()
  const {login} = useAuthStore()
  const { message } = App.useApp()
  const {loading, setLoading} = useAppStore()

  const onSubmit = async (payload: any) => {
    setLoading(true)
    try {
      const res = await api.post('/api/login', payload)
      login(res.data.token)
      router.push(ROUTES.planner.event)
    } catch (error) {
    }
    setLoading(false)
  }

  const validateMessages = {
    required: '${label} is required!'
  }

  const goWaitlist = () => {
    router.push('/waitlist')
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
                <Button block type="primary">
                  Login via One Time Password
                </Button>
                <div className={style.divider}><span className={style.divider_text}>OR</span></div>
                <Button block onClick={goWaitlist}>
                  Join the waitlist
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