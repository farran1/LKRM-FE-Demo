import { memo } from 'react'
import { Dropdown, Tooltip, Button } from 'antd'
import type { MenuProps } from 'antd'
import { useRouter } from 'next/navigation'
import { BookOutlined } from '@ant-design/icons'
import ProfileIcon from '@/components/icon/profile.svg'
import NotificationBell from '@/components/NotificationBell'
import style from './style.module.scss'
import { useAuth } from '@/components/auth/AuthProvider'

function RightHeader() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    signOut()
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
      <Tooltip title="Notebook">
        <Button
          type="text"
          icon={<BookOutlined />}
          onClick={() => router.push('/notebook')}
          style={{
            color: '#ffffff',
            fontSize: '16px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      </Tooltip>
      <Tooltip title="Notifications">
        <div>
          <NotificationBell />
        </div>
      </Tooltip>
      <Dropdown menu={{ items }} placement="bottomRight" trigger={['hover']} overlayClassName={style.menu}>
        <ProfileIcon />
      </Dropdown>
    </div>
  )
}

export default memo(RightHeader)