import { App, Button, Drawer, Flex, Input } from 'antd'
import { memo, useCallback, useEffect, useState } from 'react'
import style from './style.module.scss'
import CloseIcon from '@/components/icon/close.svg'
import api from '@/services/api'
import { MAX_NOTE } from '@/utils/constants'
import NoteList from '@/components/note-list'

function AddNote({ notes, player, isOpen, showOpen, onRefresh }: any) {
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const { message } = App.useApp()

  // Don't render if player is not available
  if (!player || !player.id) {
    return null
  }

  const saveNote = useCallback(async () => {
    if (!note.trim() || !player?.id) return
    setSaving(true)
    try {
      await api.post(`/api/players/${player.id}/notes`, { content: note.trim() })
      message.success('Note saved!')
      onRefresh()
      setNote('')
    } catch (error) {
      message.error('Failed to save note')
      console.error('Error saving note:', error)
    } finally {
      setSaving(false)
    }
  }, [note, player?.id, onRefresh, message])

  const handleChangeNote = (e: any) => {
    setNote(e.target.value)
  }

  const onClose = () => {
    showOpen(false)
    setNote('')
  }

  const handleSaveNow = async () => {
    if (!note.trim()) {
      message.warning('Please enter a note to save')
      return
    }
    await saveNote()
  }

  const handleNoteDeleted = useCallback((noteId: number) => {
    // Refresh the notes list when a note is deleted
    onRefresh()
  }, [onRefresh])

  return (
    <Drawer
      destroyOnHidden
      className={style.drawer}
      width={548}
      onClose={onClose}
      open={isOpen}
      styles={{
        body: {
          paddingBottom: 80,
        },
      }}
    >
      <Flex className={style.header} justify="space-between" align='flex-end' style={{ marginBottom: 16 }}>
        <div className={style.title}>Notes</div>
        <CloseIcon onClick={onClose} />
      </Flex>
      
      <Flex justify='space-between' align='center' style={{ marginBottom: 12 }}>
        <div className={style.subtitle}>Add New Note</div>
        <Button 
          className={style.btnOutline} 
          onClick={handleSaveNow}
          disabled={!note.trim() || saving}
          loading={saving}
        >
          Save
        </Button>
      </Flex>
      
      <div style={{ marginBottom: 16 }}>
        <label style={{ color: '#fff', marginBottom: 8, display: 'block' }}>Note</label>
        <Input.TextArea 
          rows={3} 
          placeholder="Enter Note here" 
          style={{ borderColor: 'rgba(237, 237, 237, 0.3)' }} 
          value={note} 
          onChange={handleChangeNote} 
        />
      </div>

      {notes && notes.length > 0 && (
        <>
          <div className={style.subtitle} style={{ marginTop: 16 }}>Previous Notes</div>
          <NoteList 
            notes={notes} 
            onNoteDeleted={handleNoteDeleted}
            playerId={player.id}
            itemType="note"
          />
        </>
      )}
    </Drawer>
  )
}

export default memo(AddNote)