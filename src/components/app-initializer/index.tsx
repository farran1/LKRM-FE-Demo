'use client'

import { memo, useEffect } from 'react'
import { App } from 'antd'
import { setErrorHandler } from '@/services/api'
// import { LoadingOutlined } from '@ant-design/icons';
// import style from './style.module.scss'
// import useAppStore from '@/store/app';

const AppInitializer = () => {
  const { notification } = App.useApp()

  useEffect(() => {
    setErrorHandler((msg) =>
      notification.error({
        message: null, // suppress default title
        description: msg,
        style: {
          backgroundColor: '#2c1618',
          border: '1px solid #5b2526',
          borderRadius: 8,
          padding: '8px 16px 16px'
        },
        closeIcon: false
      })
    )
  }, [notification])

  return null
}

export default memo(AppInitializer)