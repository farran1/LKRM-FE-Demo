import { App, Button, Drawer, Flex, Form, Input } from 'antd'
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
  const [form] = Form.useForm()
  const { message } = App.useApp()

  const [noteList, setNoteList] = useState<Array<any>>([])

  useEffect(() => {
    setNoteList(notes)
  }, [notes])

  const onClose = () => {
    showOpen(false)
    reset()
    setLoading(false)
  }

  const onSubmit = async () => {
    const payload = {
      notes: noteList.map(item => item.note)
    }
    setLoading(true)
    try {
      const res = await api.post(`/api/players/${player.id}/notes`, payload)
      onRefresh()
      onClose()
    } catch (error) {
    }
    setLoading(false)
  }

  const reset = () => {
    setNote('')
  }

  const handleChangeNote = (e: any) => {
    setNote(e.target.value);
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
            <Input.TextArea rows={3} placeholder="Enter Note here" style={{ borderColor: 'rgba(237, 237, 237, 0.3)' }} value={note} onChange={handleChangeNote} />
          </Form.Item>

          {noteList.length > 0 &&
            <>
              <div className={style.subtitle} style={{ marginTop: 16 }}>Previous Notes</div>
              <NoteList notes={noteList} deleteNote={deleteNote} />
            </>
          }

          <Flex style={{ marginTop: 60 }} gap={8}>
            <Button block onClick={reset}>
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