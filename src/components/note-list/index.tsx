import { memo, useCallback } from 'react'
import style from './style.module.scss'
import { Flex } from 'antd'
import TrashIcon from '@/components/icon/trash.svg'
import { useAuthStore } from '@/store/auth'

interface Note {
  id?: number;
  note: string;
  createdUser?: {
    profile: {
      firstName: string;
    };
  };
}

interface NoteListProps {
  notes: Note[];
  deleteNote: (index: number) => void;
}

function NoteList({ notes, deleteNote }: NoteListProps) {
  const { user } = useAuthStore()

  const renderAuthor = useCallback((item: Note) => {
    if (item?.createdUser) return <div className={style.createdBy}>By Coach {item?.createdUser.profile.firstName}</div>
    return <div className={style.createdBy}>By Coach {user?.profile.firstName}</div>
  }, [user])

  return (
    notes.map((item: Note, index: number) =>
              <div className={style.cardNote} key={index + (item.id || 0)}>
        <Flex justify='space-between'>
          <div>
            <div className={style.note}>{item.note}</div>
            {renderAuthor(item)}
          </div>
          <div>
            {/* <EditIcon style={{ marginRight: 8 }} /> */}
            <TrashIcon onClick={() => deleteNote(index)} />
          </div>
        </Flex>
      </div>
    )
  )
}

export default memo(NoteList)