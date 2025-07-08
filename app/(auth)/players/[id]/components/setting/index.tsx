import { Dropdown, MenuProps } from 'antd'
import { memo } from 'react'
import MoreIcon from '@/components/icon/more.svg'
import PenIcon from '@/components/icon/pen.svg'
import TrashIcon from '@/components/icon/trash2.svg'
import ArchiveIcon from '@/components/icon/archieve.svg'
import style from './style.module.scss'

function Setting({onEdit} : any) {  
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
    {
      key: 'delete',
      label: 'Delete',
      onClick: onDelete,
      icon: <TrashIcon />
    },
  ]

  function onArchive() {

  }

  function onDelete() {

  }

  return (
    <Dropdown menu={{ items }} placement="bottomRight" trigger={['click']} overlayClassName={style.menu}>
       <MoreIcon className={style.setting} />
    </Dropdown>
  )
}

export default memo(Setting)