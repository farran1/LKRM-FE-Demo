import { App, Button, Drawer, Flex, Form, Input, Modal } from 'antd'
import { memo, useCallback, useEffect, useState } from 'react'
import style from './style.module.scss'
import CloseIcon from '@/components/icon/close.svg'
import api from '@/services/api'
import TrashIcon from '@/components/icon/trash.svg'
import { MAX_NOTE } from '@/utils/constants'
import NoteList from '@/components/note-list'

function AddNote({ notes, player, isOpen, showOpen, onRefresh } : any) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [form] = Form.useForm()
  const { message } = App.useApp()

  const [noteList, setNoteList] = useState<Array<any>>([])
  const [originalNotes, setOriginalNotes] = useState<Array<any>>([])

  // Don't render if player is not available
  if (!player || !player.id) {
    return null
  }

  useEffect(() => {
    setNoteList(notes || [])
    setOriginalNotes(notes || [])
  }, [notes])

  // Auto-save functionality (only when closing)
  const autoSaveNote = useCallback(async (noteText: string) => {
    if (!noteText.trim() || !player?.id) return
    
    setAutoSaving(true)
    try {
      const payload = {
        note: noteText.trim()
      }
      await api.post(`/api/players/${player.id}/notes`, payload)
      message.success('Note auto-saved!')
      onRefresh() // Refresh the notes list
    } catch (error) {
      message.error('Failed to auto-save note')
      console.error('Error auto-saving note:', error)
    } finally {
      setAutoSaving(false)
    }
  }, [player?.id, onRefresh, message])

  const handleChangeNote = (e: any) => {
    setNote(e.target.value)
  }

  const onClose = () => {
    // Auto-save any remaining text before closing
    if (note.trim() && player?.id) {
      autoSaveNote(note)
    }
    showOpen(false)
    reset()
    setLoading(false)
  }

  const onSubmit = async () => {
    if (!player?.id) return
    
    setLoading(true)
    try {
      // Auto-add the current note if there's text in the textarea
      let notesToSave = [...noteList]
      if (note.trim() && !noteList.some(item => item.note === note.trim())) {
        notesToSave = [...noteList, { note: note.trim() }]
      }
      
      // Only save new notes (not existing ones)
      const newNotes = notesToSave.slice(originalNotes.length)
      
      for (const noteItem of newNotes) {
        const payload = {
          note: noteItem.note  // the note text
        }
        await api.post(`/api/players/${player.id}/notes`, payload)
      }
      
      if (newNotes.length > 0) {
        message.success(`${newNotes.length} note(s) added successfully`)
      } else {
        message.info('No new notes to save')
      }
      
      onRefresh()
      onClose()
    } catch (error) {
      message.error('Failed to save notes')
      console.error('Error saving notes:', error)
    }
    setLoading(false)
  }

  const reset = () => {
    setNote('')
    setNoteList(originalNotes) // Reset to original notes only
  }

  const handleClearAll = () => {
    Modal.confirm({
      title: 'Clear All Notes?',
      content: 'Are you sure you want to clear all notes? This action cannot be undone.',
      okText: 'Yes, Clear All',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        reset()
        message.success('All notes cleared')
      }
    })
  }

  const addNote = () => {
    if (!note.trim()) return
    if (noteList.length >= MAX_NOTE) {
      message.error(`You can only add up to ${MAX_NOTE} notes.`)
      return
    }
    setNoteList([...noteList, { note }])
    setNote('')
  }

  const deleteNote = useCallback((itemIndex: number) => {
    const newNoteList = noteList.filter((_: any, index: number) => index !== itemIndex)
    setNoteList(newNoteList)
  }, [noteList])

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
          <div className={style.title} >Notes</div>
          <CloseIcon onClick={onClose} />
        </Flex>
        <Form layout="vertical" form={form} onFinish={onSubmit}>
          <Flex justify='space-between' align='center' style={{ marginBottom: 12 }}>
            <div className={style.subtitle}>Add New Note</div>
            <Button className={style.btnOutline} onClick={addNote}>Add</Button>
          </Flex>
          <Form.Item label="Note" style={{ marginBottom: 0 }}>
            <Input.TextArea 
              rows={3} 
              placeholder="Enter Note here (auto-saves when closing)" 
              style={{ borderColor: 'rgba(237, 237, 237, 0.3)' }} 
              value={note} 
              onChange={handleChangeNote} 
            />
            {autoSaving && (
              <div style={{ fontSize: '12px', color: '#52c41a', marginTop: '4px' }}>
                Auto-saving...
              </div>
            )}
          </Form.Item>

          {noteList.length > 0 &&
            <>
              <div className={style.subtitle} style={{ marginTop: 16 }}>Previous Notes</div>
              <NoteList notes={noteList} deleteNote={deleteNote} />
            </>
          }

          <Flex style={{ marginTop: 60 }} gap={8}>
            <Button block onClick={handleClearAll}>
              Clear all
            </Button>
            <Button type="primary" htmlType="submit"  block loading={loading}>
              Update
            </Button>
          </Flex>
        </Form>
    </Drawer>
  )
}

export default memo(AddNote)