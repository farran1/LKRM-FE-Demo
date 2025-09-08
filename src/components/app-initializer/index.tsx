'use client'

import { memo, useEffect } from 'react'
import { App } from 'antd'
import { setErrorHandler } from '@/services/api'
import api from '@/services/api'
import { mutate } from 'swr'
// import { LoadingOutlined } from '@ant-design/icons';
// import style from './style.module.scss'
// import useAppStore from '@/store/app';

const AppInitializer = () => {
  const { notification } = App.useApp()

  useEffect(() => {
    // Only set the error handler if notification is available
    if (notification) {
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
    }
  }, [notification])

  // Warm critical SWR caches in background so screens open instantly
  useEffect(() => {
    const controller = new AbortController()

    async function preload() {
      try {
        // Define common, read-heavy endpoints to warm
        const requests: Array<Promise<void>> = [
          // Recent events for selectors/calendars
          api.get('/api/events', { params: { perPage: 50 } })
            .then(res => mutate('/api/events?perPage=50', (res?.data as any)?.data ?? res?.data, { populateCache: true, revalidate: false }))
            .catch(() => {}),

          // Event types for dropdowns
          api.get('/api/eventTypes')
            .then(res => mutate('/api/eventTypes', (res?.data as any)?.data ?? res?.data, { populateCache: true, revalidate: false }))
            .catch(() => {}),

          // Players for selectors/rosters
          api.get('/api/players', { params: { perPage: 200 } })
            .then(res => mutate('/api/players?perPage=200', (res?.data as any)?.data ?? res?.data, { populateCache: true, revalidate: false }))
            .catch(() => {}),
        ]

        await Promise.allSettled(requests)
      } catch {
        // Silent warmup failure
      }
    }

    preload()
    return () => controller.abort()
  }, [])

  return null
}

export default memo(AppInitializer)