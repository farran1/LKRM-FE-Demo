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
import { safeMapData } from '@/utils/api-helpers'
import { useAuth } from '@/components/auth/AuthProvider' // Add this import

function NewPlayer() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [positions, setPositions] = useState<Array<{ label: string; value: number }>>([])
  const { message } = App.useApp()
  const [form] = Form.useForm() // Add form reference
  const { user } = useAuth() // Add this hook to get the authenticated user



  const [note, setNote] = useState('')
  const [noteList, setNoteList] = useState<Array<any>>([])
  const [goal, setGoal] = useState('')
  const [goalList, setGoalList] = useState<Array<any>>([])


  useEffect(() => {
    getPositions()
    // Also check the database schema to debug issues
    checkDatabaseSchema()
  }, [])

  async function checkDatabaseSchema() {
    try {
      console.log('Checking database schema...')
      const res = await api.get('/api/schema-check')
      console.log('Schema check response:', res)
    } catch (error) {
      console.error('Error checking schema:', error)
    }
  }

  async function getPositions() {
    try {
      console.log('Fetching positions...')
      const res = await api.get('/api/positions')
      console.log('Positions API response:', res) // Debug log
      console.log('Response data type:', typeof (res as any)?.data)
      console.log('Response data:', (res as any)?.data)
      console.log('Response data.data:', (res as any)?.data?.data)
      
      // Check if we have data in the expected format
      if ((res as any)?.data?.data && Array.isArray((res as any).data.data)) {
        console.log('Using res.data.data format')
        const positionOptions = (res as any).data.data.map((item: any) => ({
          label: item.name, 
          value: item.id
        }))
        setPositions(positionOptions)
      } else if ((res as any)?.data && Array.isArray((res as any).data)) {
        console.log('Using res.data format')
        const positionOptions = (res as any).data.map((item: any) => ({
          label: item.name, 
          value: item.id
        }))
        setPositions(positionOptions)
      } else {
        // Fallback to hardcoded positions if API doesn't return expected format
        console.warn('API response format unexpected, using fallback positions')
        console.warn('Response structure:', JSON.stringify(res, null, 2))
        const fallbackPositions = [
          { label: 'Center', value: 1 },
          { label: 'Guard', value: 2 },
          { label: 'Forward', value: 3 }
        ]
        setPositions(fallbackPositions)
      }
    } catch (error) {
      console.error('Error fetching positions:', error)
      // Fallback to hardcoded positions on error
      const fallbackPositions = [
        { label: 'Center', value: 1 },
        { label: 'Guard', value: 2 },
        { label: 'Forward', value: 3 }
      ]
      setPositions(fallbackPositions)
    }
  }

  const goBack = () => {
    router.back()
  }

  const resetForm = () => {
    form.resetFields()
    setNoteList([])
    setGoalList([])
    setNote('')
    setGoal('')
  }

  const onSubmit = async (payload: any) => {
    try {
      console.log('Form submission started with payload:', payload)
      
      // Validate form first
      await form.validateFields()
      console.log('Form validation passed')
      
      // Prepare player data for API
      const playerData = {
        name: `${payload.firstName} ${payload.lastName}`.trim(),
        firstName: payload.firstName,
        lastName: payload.lastName,
        position_id: payload.positionId,  // This will be mapped to "positionId" in the API
        jersey_number: payload.jersey,
        school_year: payload.schoolYear,
        // Notes and goals can be added later via separate API calls
        notes: noteList.map(item => item.note),
        goals: goalList.map(item => item.goal)
      }

      // Debug: Log what we're sending
      console.log('Form payload:', payload)
      console.log('Player data being sent:', playerData)
      console.log('Notes being sent:', noteList)
      console.log('Goals being sent:', goalList)
      console.log('Positions available:', positions)
      console.log('Selected position ID:', payload.positionId)
      console.log('Selected position details:', positions.find(p => p.value === payload.positionId))

      setLoading(true)
      
      console.log('Making API call to /api/players...')
      const res = await api.post('/api/players', playerData)
      
      console.log('API response received:', res)
      console.log('Response status:', res.status)
      console.log('Response data:', res.data)
      
      // Log detailed error if available
      if ((res as any).data?.error) {
        console.error('Detailed API error:', (res as any).data.error)        
        console.error('Error details:', JSON.stringify((res as any).data.error, null, 2))
      }

      if (res.status === 200 || res.status === 201) {
        message.success('Player created successfully!')
        goBack()
      } else {
        message.error('Failed to create player. Please try again.')
      }
    } catch (error: any) {
      console.error('Error creating player:', error)
      
      // Log detailed error information
      if (error.response) {
        // Server responded with error status
        console.error('Error response:', error.response)
        console.error('Error status:', error.response.status)
        console.error('Error data:', error.response.data)
        
        if (error.response.data?.message) {
          message.error(`API Error: ${error.response.data.message}`)
        } else if (error.response.status === 400) {
          message.error('Bad request - please check your input data')
        } else if (error.response.status === 401) {
          message.error('Unauthorized - please log in again')
        } else if (error.response.status === 403) {
          message.error('Forbidden - you don\'t have permission to create players')
        } else if (error.response.status === 500) {
          message.error('Server error - please try again later')
        } else {
          message.error(`Server error (${error.response.status}) - please try again`)
        }
      } else if (error.request) {
        // Request was made but no response received
        console.error('No response received:', error.request)
        message.error('No response from server - please check your connection')
      } else if (error.errorFields) {
        // Form validation error
        console.error('Form validation errors:', error.errorFields)
        message.error('Please fill in all required fields correctly.')
      } else {
        // Other error
        console.error('Other error:', error.message || error)
        message.error(`Error: ${error.message || 'Failed to create player. Please try again.'}`)
      }
    } finally {
      setLoading(false)
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
      <Form 
        layout="vertical" 
        onFinish={onSubmit} 
        form={form}
        initialValues={{ isRepeat: false }}
      >
        <Flex justify="space-between" align="center" style={{ marginBottom: 28 }}>
          <Flex align='center' gap={16}>
            <ArrowIcon onClick={goBack} style={{ cursor: 'pointer' }} />
            <div className={style.title}>Add New Player</div>
          </Flex>
          <Flex align='center' gap={10}>
            <Button onClick={resetForm}>Reset</Button>
            <Button type="primary" htmlType="submit" loading={loading}>Save</Button>
          </Flex>
        </Flex>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <div className={style.card}>
              <div className={style.title2}>Player Details</div>


              <Form.Item name="firstName" rules={[{ required: true, message: 'Please enter first name' }]} label="First Name">
                <Input placeholder="Enter First Name" />
              </Form.Item>
              <Form.Item name="lastName" rules={[{ required: true, message: 'Please enter last name' }]} label="Last Name">
                <Input placeholder="Enter Last Name" />
              </Form.Item>
              <Form.Item name="positionId" rules={[{ required: true, message: 'Please select a position' }]} label="Position">
                <Select placeholder="Select Position" loading={loading}>
                  {positions.map((item: any) => <Select.Option key={item.value} value={item.value}>{item.label}</Select.Option>)}
                </Select>
              </Form.Item>
              <Form.Item name="jersey" rules={[{ required: true, max: 50, message: 'Please enter Jersey Number' }]} label="Jersey #">
                <Input placeholder="Enter Jersey #" />
              </Form.Item>
              
              <Form.Item name="schoolYear" rules={[{ required: true, message: 'Please select school year' }]} label="School Year">
                <Select placeholder="Select School Year">
                  <Select.Option key="freshman" value="freshman">Freshman</Select.Option>
                  <Select.Option key="sophomore" value="sophomore">Sophomore</Select.Option>
                  <Select.Option key="junior" value="junior">Junior</Select.Option>
                  <Select.Option key="senior" value="senior">Senior</Select.Option>
                </Select>
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