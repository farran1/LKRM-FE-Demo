'use client'

import { memo, useCallback, useEffect, useRef, useState } from 'react'
import style from './style.module.scss'
import { App, Button, Col, Flex, Form, Input, Row, Select } from 'antd'
import ArrowIcon from '@/components/icon/arrow_left.svg'
import { useRouter } from 'next/navigation'
import api from '@/services/api'
import { PlusOutlined } from '@ant-design/icons'
import EditIcon from '@/components/icon/edit.svg'
import TrashIcon from '@/components/icon/trash.svg'
import { MAX_GOAL, MAX_NOTE } from '@/utils/constants'
import NoteList from '@/components/note-list'

function NewPlayer() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [positions, setPositions] = useState([])
  const { message } = App.useApp()

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [note, setNote] = useState('')
  const [noteList, setNoteList] = useState<Array<any>>([])
  const [goal, setGoal] = useState('')
  const [goalList, setGoalList] = useState<Array<any>>([])


  useEffect(() => {
    getPositions()
  }, [])

  async function getPositions() {
    const res = await api.get('/api/positions')
    if (res?.data?.data.length > 0) {
      const types = res?.data?.data.map((item: any) => ({label: item.name, value: item.id}))
      setPositions(types)
    }
  }

  const goBack = () => {
    router.back()
  }

  const onSubmit = async (payload: any) => {
    const formData = new FormData()
    if (file) {
      formData.append('avatar', file)
    }

    noteList.forEach(item => {
      formData.append('notes', item.note)
    })
    goalList.forEach(item => {
      formData.append('goals', item.note)
    })

    for (let key in payload) {
      formData.append(key, payload[key])
    }
    setLoading(true)
    try {
      const res = await api.post('/api/players', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      console.log(res.status)
      goBack()
    } catch (error) {
    }
    setLoading(false)
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected && selected.type.startsWith('image/')) {
      setFile(selected)
      setPreviewUrl(URL.createObjectURL(selected))
    } else {
      message.error('Please select an image file')
    }
  }

  const handleChangeNote = (e: any) => {
    setNote(e.target.value);
  }

  const addNote = () => {
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

  const handleChangeGoal = (e: any) => {
    setGoal(e.target.value)
  }

  const addGoal = () => {
    if (goalList.length >= MAX_GOAL) {
      message.error(`You can only add up to ${MAX_GOAL} goals.`)
      return
    }
    setGoalList([...goalList, { note: goal }])
    setGoal('')
  }

  const deleteGoal = useCallback((itemIndex: number) => {
    const newGoalList = goalList.filter((_: any, index: number) => index !== itemIndex)
    setGoalList(newGoalList)
  }, [goalList])

  return (
    <div className={style.container}>
      <Form layout="vertical" onFinish={onSubmit} initialValues={{ isRepeat: false }}>
        <Flex justify="space-between" align="center" style={{ marginBottom: 28 }}>
          <Flex align='center' gap={16}>
            <ArrowIcon onClick={goBack} style={{ cursor: 'pointer' }} />
            <div className={style.title}>Add New Player</div>
          </Flex>
          <Flex align='center' gap={10}>
            <Button type="primary" htmlType="submit" loading={loading}>Save</Button>
          </Flex>
        </Flex>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <div className={style.card}>
              <div className={style.title2}>Player Details</div>
              <div style={{ marginBottom: 24 }}>
                <div className={style.avatar} onClick={handleAvatarClick}>
                  {previewUrl ? (
                    <img src={previewUrl} alt="avatar" />
                  ) : (
                    <PlusOutlined style={{ fontSize: 32, color: '#0F172A' }} />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <div>Add Profile Picture</div>
              </div>

              <Form.Item name="name" rules={[{ required: true, max: 255 }]} label="Name">
                <Input placeholder="Enter Name" />
              </Form.Item>
              <Form.Item name="positionId" rules={[{ required: true }]} label="Position">
                <Select placeholder="Enter Position">
                  {positions.map((item: any) => <Select.Option value={item.value}>{item.label}</Select.Option>)}
                </Select>
              </Form.Item>
              <Form.Item name="jersey" rules={[{ required: true, max: 50, message: 'Please enter Jersey Number' }]} label="Jersey #">
                <Input placeholder="Enter Jersey #" />
              </Form.Item>
              <Form.Item name="phoneNumber" rules={[{ required: true }]} label="Phone Number">
                <Input placeholder="Enter Phone Number" />
              </Form.Item>
              <Form.Item name="height" label="Height"
                rules={[
                  { required: true },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (value === undefined) {
                        return Promise.resolve();
                      }
                      if (value > 200) {
                        return Promise.reject(new Error('Height must be at most 200"'));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}>
                <Input type="number" placeholder="Enter Height" />
              </Form.Item>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div className={style.card} style={{ marginBottom: 24 }}>
              <div className={style.title2}>Player Notes</div>
              <Flex justify='space-between' align='center' style={{ marginBottom: 12 }}>
                <div className={style.subtitle}>Add New Note</div>
                <Button className={style.btnOutline} disabled={!note.trim()} onClick={addNote}>Add</Button>
              </Flex>
              <Form.Item label="Note" style={{ marginBottom: 0 }}>
                <Input.TextArea rows={3} placeholder="Enter Note here" style={{ borderColor: 'rgba(237, 237, 237, 0.3)' }} value={note} onChange={handleChangeNote} />
              </Form.Item>

              {noteList.length > 0 &&
                <>
                  <div className={style.subtitle} style={{ marginTop: 16 }}>Added Notes</div>
                  <NoteList notes={noteList} deleteNote={deleteNote} />
                </>
              }
            </div>
            <div className={style.card}>
              <div className={style.title2}>Player Goals</div>
              <Flex justify='space-between' align='center' style={{ marginBottom: 12 }}>
                <div className={style.subtitle}>Add New Goal</div>
                <Button className={style.btnOutline} disabled={!goal.trim()} onClick={addGoal}>Add</Button>
              </Flex>
              <Form.Item label="Goal" style={{ marginBottom: 0 }}>
                <Input.TextArea rows={3} placeholder="Enter Goal here" style={{ borderColor: 'rgba(237, 237, 237, 0.3)' }} value={goal} onChange={handleChangeGoal} />
              </Form.Item>

              {goalList.length > 0 &&
                <>
                  <div className={style.subtitle} style={{ marginTop: 16 }}>Added Goals</div>
                  <NoteList notes={goalList} deleteNote={deleteGoal} />
                </>
              }
            </div>
          </Col>
        </Row>
      </Form>
    </div>
  )
}

export default memo(NewPlayer)