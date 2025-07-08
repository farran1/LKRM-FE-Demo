import { memo, useEffect } from 'react'
import { Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import ProfileIcon from '@/components/icon/profile.svg'
import BellIcon from '@/components/icon/bell-alert.svg'
import style from './style.module.scss'
import { useAuthStore } from '@/store/auth'
import api from '@/services/api'

function RightHeader() {
  const {logout, setUser} = useAuthStore()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async() => {
    const res = await api.get('/api/me')
    setUser(res.data.user)
  }

  const handleLogout = () => {
    logout()
  }

  const items: MenuProps['items'] = [
    {
      key: 'logout',
      label: 'Logout',
      onClick: handleLogout,
    },
  ]

  return (
    <div className={style.container}>
      <BellIcon />
      <Dropdown menu={{ items }} placement="bottomRight" trigger={['hover']} overlayClassName={style.menu}>
        <ProfileIcon />
      </Dropdown>
    </div>
  )
}

export default memo(RightHeader)