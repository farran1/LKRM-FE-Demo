'use client'

import { Form, Input, Button, Card, ConfigProvider, Row, Checkbox, Flex, App, Col } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import style from './style.module.scss'
import Link from 'next/link';
import Logo from '@/components/icon/logo.svg'
import api from '@/services/api';
import useAppStore from '@/store/app';
import { useState } from 'react';
import FB from '@/components/icon/logo-facebook.svg'
import Insta from '@/components/icon/logo-instagram.svg'
import Linkedin from '@/components/icon/logo-linkedin.svg'
import Twitter from '@/components/icon/logo-twitter.svg'

const Waitlist = () => {
  const router = useRouter()
  const {login} = useAuthStore()
  const { message } = App.useApp()
  const {loading, setLoading} = useAppStore()
  const [isShowResult, showResult] = useState(false)

  const onSubmit = async (payload: any) => {
    setLoading(true)
    try {
      const res = await api.post('/api/waitlist', payload)
      showResult(true)
    } catch (error) {
    }
    setLoading(false)
  }

  const validateMessages = {
    required: '${label} is required!'
  }

  const goLogin = () => {
    router.push('/login')
  }

  const renderForm = () => (
    <ConfigProvider form={{ validateMessages }}>
      <Form onFinish={onSubmit} layout="vertical">
        <Row gutter={{ md: 10 }}>
          <Col xs={24} md={12}>
            <Form.Item name="firstName" rules={[{ required: true }]} label="First name">
              <Input type="text" placeholder="Enter first name" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="lastName" rules={[{ required: true }]} label="Last name">
              <Input type="text" placeholder="Enter last name" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="institute" rules={[{ required: true }]} label="Institute name">
          <Input type="text" placeholder="Enter institute name" />
        </Form.Item>
        <Form.Item name="email" rules={[{ required: true }]} label="Email">
          <Input type="email" placeholder="Enter email" />
        </Form.Item>
        <Form.Item name="phoneNumber" rules={[{ required: true }]} label="Phone number">
          <Input type="text" placeholder="Enter phone number" />
        </Form.Item>

        <div>
          <Button block type="primary" htmlType="submit" style={{ marginBottom: 10 }}>
            Join Waitlist
          </Button>
          <div className={style.divider}><span className={style.divider_text}>OR</span></div>
          <Button block onClick={goLogin}>
            Back to Login
          </Button>
        </div>
      </Form>
    </ConfigProvider>
  )

  const renderResult = () => (
    <div>
      <h2 className={style.title}>You're on the List!</h2>
      <p className={style.p}>Thank you for signing up for early access to LKRM – the ultimate locker room management tool for coaches and teams.</p>
      <p className={style.sub_p}>We’ll keep you updated on our progress and let you know when it’s your turn to get access.</p>
      <div className={style.social}>
        <div className={style.social_title}>Follow us at:</div>
        <div className={style.icon}>
          <Twitter /><FB /><Insta /><Linkedin />
        </div>
      </div>
      <Button block onClick={goLogin}>
        Back to Login
      </Button>
    </div>
  )

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
          {!isShowResult && renderForm()}
          {isShowResult && renderResult()}
        </div>
      </div>
    </div>
  )
}

export default Waitlist