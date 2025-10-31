import { memo, useCallback, useState } from 'react'
import style from './style.module.scss'
import { Flex } from 'antd'
import TrashIcon from '@/components/icon/trash.svg'
import { useAuthStore } from '@/store/auth'
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal'
import api from '@/services/api'
import { App } from 'antd'

interface Note {
  id?: number;
  // For notes
  note?: string;
  // For goals
  goal?: string;
  goal_text?: string;
  createdUser?: {
    id: number;
    username: string;
    email: string;
  };
}

interface NoteListProps {
  notes: Note[];
  // For player create page, allow local deletion callback
  deleteNote?: (index: number) => void;
  // For detail pages with persisted notes/goals
  onNoteDeleted?: (noteId: number) => void;
  playerId?: number;
  itemType?: 'note' | 'goal';
}

function NoteList({ notes, deleteNote, onNoteDeleted, playerId, itemType }: NoteListProps) {
  const { user } = useAuthStore()
  const { message } = App.useApp()
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    note: Note | null;
    loading: boolean;
  }>({
    isOpen: false,
    note: null,
    loading: false
  })

  const renderAuthor = useCallback((item: Note) => {
    // Try to get author from the note's createdUser
    if (item?.createdUser?.username) {
      return <div className={style.createdBy}>By Coach {item.createdUser.username}</div>
    }
    
    if (item?.createdUser?.email) {
      const emailName = item.createdUser.email.split('@')[0]
      return <div className={style.createdBy}>By Coach {emailName}</div>
    }
    
    // Fallback to current user
    if (user?.profile?.firstName) {
      return <div className={style.createdBy}>By Coach {user.profile.firstName}</div>
    }
    
    // Fallback to email if no profile name
    if (user?.email) {
      const emailName = user.email.split('@')[0]
      return <div className={style.createdBy}>By Coach {emailName}</div>
    }
    
    // Final fallback
    return <div className={style.createdBy}>By Coach</div>
  }, [user])

  const handleDeleteClick = useCallback((note: Note) => {
    setDeleteModal({
      isOpen: true,
      note,
      loading: false
    })
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteModal.note?.id || !playerId) return

    setDeleteModal(prev => ({ ...prev, loading: true }))

    try {
      const endpoint = itemType === 'note' 
        ? `/api/players/${playerId}/notes/${deleteModal.note.id}`
        : `/api/players/${playerId}/goals/${deleteModal.note.id}`
      
      console.log('Deleting item:', { endpoint, noteId: deleteModal.note.id, itemType, playerId })
      
      const response = await api.delete(endpoint)
      console.log('Delete response:', response)
      
      // The API service returns { data, status } format
      // Check if the deletion was successful (status < 400 or response.data exists)
      const status = (response as any)?.status
      const responseData = (response as any)?.data
      
      if ((status && status < 400) || responseData) {
        message.success(`${itemType === 'note' ? 'Note' : 'Goal'} deleted successfully`)
        
        console.log('Calling onNoteDeleted with:', deleteModal.note.id)
        onNoteDeleted && onNoteDeleted(deleteModal.note.id)
        
        setDeleteModal({ isOpen: false, note: null, loading: false })
      } else {
        // If no clear success indicator, check if there's an error
        const errorMessage = responseData?.error || 'Delete operation failed'
        throw new Error(errorMessage)
      }
    } catch (error: any) {
      console.error(`Error deleting ${itemType}:`, error)
      const errorMessage = error?.message || error?.data?.error || `Failed to delete ${itemType}. Please try again.`
      message.error(errorMessage)
      setDeleteModal(prev => ({ ...prev, loading: false }))
    }
  }, [deleteModal.note, playerId, itemType, onNoteDeleted, message])

  const handleDeleteCancel = useCallback(() => {
    setDeleteModal({ isOpen: false, note: null, loading: false })
  }, [])

  return (
    <>
      {notes.map((item: Note, index: number) => {
        // Create a unique key using item.id, created_at, and index as fallback
        const uniqueKey = item.id 
          ? `note-${item.id}` 
          : `note-${index}-${item.note?.slice(0, 10) || 'unknown'}`
        
        // Pick the correct display text for notes vs goals
        const displayText = item.note || item.goal || item.goal_text || ''
        
        return (
          <div className={style.cardNote} key={uniqueKey}>
            <Flex justify='space-between'>
              <div>
                <div className={style.note}>{displayText}</div>
                {renderAuthor(item)}
              </div>
              <div>
                {typeof deleteNote === 'function'
                  ? <TrashIcon onClick={() => deleteNote(index)} />
                  : <TrashIcon onClick={() => handleDeleteClick(item)} />}
              </div>
            </Flex>
          </div>
        )
      })}
      
      {!deleteNote && itemType && playerId && (
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title={`${itemType === 'note' ? 'Note' : 'Goal'} #${deleteModal.note?.id || ''}`}
          content={deleteModal.note?.note || ''}
          itemType={itemType}
          loading={deleteModal.loading}
        />
      )}
    </>
  )
}

export default memo(NoteList)