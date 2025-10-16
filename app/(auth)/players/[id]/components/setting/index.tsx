import { Dropdown, MenuProps, App } from 'antd'
import { memo } from 'react'
import { useRouter } from 'next/navigation'
import MoreIcon from '@/components/icon/more.svg'
import PenIcon from '@/components/icon/pen.svg'
import ArchiveIcon from '@/components/icon/archieve.svg'
import style from './style.module.scss'
import api from '@/services/api'

function Setting({onEdit, player} : any) {  
  const { modal, message } = App.useApp()
  const router = useRouter()
  const items: MenuProps['items'] = [
    {
      key: 'edit',
      label: 'Edit',
      onClick: onEdit,
      icon: <PenIcon />
    },
    {
      key: 'archive',
      label: 'Archive',
      onClick: onArchive,
      icon: <ArchiveIcon />
    },
  ]

  function onArchive() {
    if (!player?.id) return
    modal.confirm({
      title: 'Archive player?',
      content: 'This hides the player from your Players page. You can contact support to restore later.',
      okText: 'Archive',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await api.delete(`/api/players/${player.id}`)
          message.success('Player archived')
          // Let the page decide how to refresh; emit a custom event
          window.dispatchEvent(new CustomEvent('player-archived', { detail: { id: player.id } }))
          // Navigate back to players list
          router.push('/players')
        } catch (e) {
          message.error('Failed to archive player')
        }
      }
    })
  }

  return (
    <Dropdown menu={{ items }} placement="bottomRight" trigger={['click']} overlayClassName={style.menu}>
       <MoreIcon className={style.setting} />
    </Dropdown>
  )
}

export default memo(Setting)