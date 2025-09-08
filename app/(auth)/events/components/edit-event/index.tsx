import { Button, Col, DatePicker, Drawer, Flex, Form, Input, Row, Select, Switch, TimePicker, Typography, Radio, Checkbox } from 'antd'
import { memo, useEffect, useMemo, useState } from 'react'
import CloseIcon from '@/components/icon/close.svg'
import style from './style.module.scss'
import TagSelector from '@/components/tag-selector'
import api from '@/services/api'
import { convertDateTime } from '@/utils/app'
import { PlusOutlined } from '@ant-design/icons'
import NewEventType from '../new-event-type'
import dayjs from 'dayjs'
import { safeMapData } from '@/utils/api-helpers'
import { supabase } from '@/lib/supabase'

const { Title } = Typography

// ['Workout', 'Meeting', 'Practice', 'Scrimmage', 'Tournament', 'Championship']
const locations = [{label: 'Home', value: 'HOME'}, {label: 'Away', value: 'AWAY'}]

function EditEvent({ event, isOpen, showOpen, onRefresh } : any) {
  const [loading, setLoading] = useState(false)
  const [eventTypes, setEventTypes] = useState<Array<{ label: string; value: number }>>([])
  const [isShowModalNewType, showModalNewType] = useState(false)
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null)
  const [coaches, setCoaches] = useState<{ label: string; value: string }[]>([])
  const [form] = Form.useForm()

  useEffect(() => {
    getEventTypes()
    getCoaches()
  }, [])

  useEffect(() => {
    if (event) {
      setSelectedTypeId(event.eventTypeId)
      // Initialize form with existing event data
      form.setFieldsValue({
        name: event.name,
        eventTypeId: event.eventTypeId,
        startDate: event.startTime ? dayjs(event.startTime) : undefined,
        startTime: event.startTime ? dayjs(event.startTime) : undefined,
        endDate: event.endTime ? dayjs(event.endTime) : undefined,
        endTime: event.endTime ? dayjs(event.endTime) : undefined,
        location: event.location,
        venue: event.venue,
        oppositionTeam: event.oppositionTeam,
        notes: event.notes,
        attendees: event.attendees || [],
        receipt: event.receipt || ''
      })
    }
  }, [event, form])

  async function getEventTypes() {
    setLoading(true)
    try {
      const res = await api.get('/api/eventTypes')
      const eventTypeOptions = safeMapData(
        res, 
        (item: any) => ({label: item.name, value: item.id}), 
        []
      )
      setEventTypes(eventTypeOptions)
    } catch (error) {
      console.error('Error fetching event types:', error)
      setEventTypes([])
    }
    setLoading(false)
  }

  async function getCoaches() {
    try {
      console.log('🔄 SUPABASE EDIT: Fetching coaches directly from Supabase users table...') // Debug log
      
      // Get authenticated users from session instead of public users table
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        console.error('No authenticated user found')
        setCoaches([])
        return
      }
      
      // Create coach options from authenticated user
      const user = session.user
      const userName = user.user_metadata?.first_name && user.user_metadata?.last_name 
        ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
        : user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown'
      
      const users = [{
        id: user.id,
        username: userName,
        email: user.email,
        role: 'COACH',
        isActive: true
      }]

      console.log('🔄 SUPABASE EDIT: Using authenticated user for coaches:', users) // Debug log

      if (!users || users.length === 0) {
        console.log('🔄 SUPABASE EDIT: No users found') // Debug log
        setCoaches([])
        return
      }

      // Process the users data
      const processedUsers = users.map(user => ({
        label: user.username || 'Unknown User',
        value: user.username || 'Unknown User'
      }))

      console.log('🔄 SUPABASE EDIT: Final processed users:', processedUsers) // Debug log
      setCoaches(processedUsers)
    } catch (error) {
      console.error('🔄 SUPABASE EDIT: Error in getCoaches:', error)
      setCoaches([])
    }
  }

  // Removed coaches fetching; not used anymore

  const onClose = () => {
    showOpen(false)
    setLoading(false)
  }

  const onSubmit = async (payload: any) => {
    setLoading(true)
    const startTime = convertDateTime(payload.startDate, payload.startTime)
    let endTime = undefined
    if (payload.endDate && payload.endTime) {
      endTime = convertDateTime(payload.endDate, payload.endTime)
    }

    delete payload.startDate
    delete payload.endDate
    payload.startTime = startTime
    payload.endTime = endTime

    // Handle "All Coaches" selection
    if (payload.attendees && Array.isArray(payload.attendees)) {
      const allCoachesIndex = payload.attendees.indexOf('all_coaches')
      if (allCoachesIndex !== -1) {
        // If "All Coaches" is selected, replace with all coach IDs
        const allCoachIds = coaches.map(coach => coach.value)
        if (allCoachIds.length > 0) {
          payload.attendees = allCoachIds
          console.log('Replaced "all_coaches" with:', allCoachIds)
        } else {
          // If no coaches available, remove "all_coaches" from attendees
          payload.attendees = payload.attendees.filter((attendee: string | number) => attendee !== 'all_coaches')
          console.warn('No coaches available to replace "all_coaches"')
        }
      }
    }

    // Recurrence mapping (Google/Outlook/Apple style → current API)
    const repeatRule = payload.repeatRule // none | daily | weekly | monthly | yearly
    const endsType = payload.endsType // never | on | after
    const endOnDate = payload.endOnDate
    const endAfterCount = payload.endAfterCount

    if (repeatRule && repeatRule !== 'none') {
      payload.isRepeat = true
      payload.repeatType = repeatRule // Map repeatRule to repeatType
      if (endsType === 'after' && endAfterCount) {
        payload.occurence = Number(endAfterCount)
      } else if (endsType === 'on' && endOnDate && payload.startTime) {
        try {
          // Roughly estimate occurrences by cadence difference + 1
          const start = new Date(payload.startTime)
          const end = new Date(endOnDate)
          const diffMs = Math.max(0, end.getTime() - start.getTime())
          const oneDay = 24 * 60 * 60 * 1000
          const calcByRule = {
            daily: Math.floor(diffMs / oneDay) + 1,
            weekly: Math.floor(diffMs / (7 * oneDay)) + 1,
            monthly: Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1),
            yearly: Math.max(1, (end.getFullYear() - start.getFullYear()) + 1)
          } as any
          const count = calcByRule[repeatRule] ?? undefined
          if (count && Number.isFinite(count)) {
            payload.occurence = count
          }
        } catch {}
      }
    } else {
      payload.isRepeat = false
      payload.repeatType = null // Set to null for non-repeating events
      delete payload.occurence
    }

    // Clean UI-only fields
    delete payload.endsType
    delete payload.endOnDate
    delete payload.endAfterCount
    delete payload.repeatRule // Remove repeatRule as it's not a database field
    // Keep daysOfWeek as it's needed for weekly repeats

    try {
      // Use originalEventId for recurring instances, otherwise use the regular id
      const eventId = event.originalEventId || event.id
      const res = await api.put('/api/events/' + eventId, payload)
      showOpen(false)
      onRefresh()
    } catch (error) {
    }
    setLoading(false)
  }

  const eventTypeTitle = useMemo(() => {
    return (
      <>
        <span>Event Type</span>
        <PlusOutlined className={style.addEventType} onClick={() => showModalNewType(true)} />
      </>
    )
  }, [])

  const refreshEventType = () => {
    getEventTypes()
  }

  const initValues = useMemo(() => {
    if (!event) return {}

    const startAt = event.startTime ? dayjs(event.startTime) : undefined
    const endAt = event.endTime ? dayjs(event.endTime) : undefined
    const members = Array.isArray(event?.event_coaches)
      ? event.event_coaches.map((c: any) => c.coachUsername)
      : []
    
    // Convert old recurrence format to new format
    let repeatRule = 'none'
    let endsType = 'never'
    let endOnDate = undefined
    let endAfterCount = undefined
    
    if (event.isRepeat) {
      if (event.occurence > 0) {
        repeatRule = 'weekly' // Default to weekly if we have occurrences
        endsType = 'after'
        endAfterCount = event.occurence
      } else {
        repeatRule = 'weekly'
        endsType = 'never'
      }
    }

    return {
      ...event,
      startDate: startAt,
      startTime: startAt,
      endDate: endAt,
      endTime: endAt,
      repeatRule,
      endsType,
      endOnDate,
      endAfterCount,
      members,
    }
  }, [event])

  return (
    <>
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
        <Flex className={style.header} justify="space-between" align='flex-end' style={{ marginBottom: 24 }}>
          <div className={style.title} >Edit Event</div>
          <CloseIcon onClick={onClose} />
        </Flex>
        <Form layout="vertical" onFinish={onSubmit} initialValues={initValues} form={form}>
          <Form.Item name="name" rules={[{ required: true, max: 255 }]} label="Name">
            <Input placeholder="Enter Event Name" />
          </Form.Item>
          <Form.Item name="eventTypeId" rules={[{ required: true, message: 'Please select Event type' }]} label={eventTypeTitle} style={{ marginBottom: 14 }}>
            <TagSelector 
              options={eventTypes}
              onChange={(val: any) => {
                const numeric = typeof val === 'string' ? Number(val) : val
                setSelectedTypeId(numeric)
              }}
            />
          </Form.Item>

          <div className={style.subtitle}>Event Start Date & Time</div>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Event Start Date" name="startDate" rules={[{ required: true, message: 'Please select the start date' }]} style={{ marginBottom: 12 }}>
                <DatePicker placeholder="Select start date" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Event Start Time" name="startTime" rules={[{ required: true, message: 'Please select the start time' }]} style={{ marginBottom: 12 }}>
                <TimePicker placeholder="Select start time" style={{ width: '100%' }} showSecond={false} use12Hours />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Event End Date" name="endDate" style={{ marginBottom: 12 }}>
                <DatePicker placeholder="Select end date" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Event End Time" name="endTime" style={{ marginBottom: 12 }}>
                <TimePicker placeholder="Select end time" style={{ width: '100%' }} showSecond={false} use12Hours />
              </Form.Item>
            </Col>
          </Row>
          
          {/* Recurrence (Google/Outlook/Apple style) */}
          <div className={style.subtitle}>Repeats</div>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="repeatRule" style={{ marginBottom: 12 }}>
                <Select>
                  <Select.Option value="none">Does not repeat</Select.Option>
                  <Select.Option value="daily">Daily</Select.Option>
                  <Select.Option value="weekly">Weekly</Select.Option>
                  <Select.Option value="monthly">Monthly</Select.Option>
                  <Select.Option value="yearly">Yearly</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item shouldUpdate noStyle>
                {() => {
                  const rule = form.getFieldValue('repeatRule')
                  if (rule === 'weekly') {
                    return (
                      <Form.Item name="daysOfWeek" style={{ marginBottom: 12 }}>
                        <Checkbox.Group
                          options={[
                            { label: 'Sun', value: 0 },
                            { label: 'Mon', value: 1 },
                            { label: 'Tue', value: 2 },
                            { label: 'Wed', value: 3 },
                            { label: 'Thu', value: 4 },
                            { label: 'Fri', value: 5 },
                            { label: 'Sat', value: 6 },
                          ]}
                        />
                      </Form.Item>
                    )
                  }
                  return null
                }}
              </Form.Item>
            </Col>
          </Row>

          <Form.Item shouldUpdate noStyle>
            {() => {
              const rule = form.getFieldValue('repeatRule')
              if (!rule || rule === 'none') return null
              return (
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Ends" name="endsType">
                      <Radio.Group>
                        <Radio value="never">Never</Radio>
                        <Radio value="on">On</Radio>
                        <Radio value="after">After</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item shouldUpdate noStyle>
                      {() => {
                        const ends = form.getFieldValue('endsType')
                        if (ends === 'on') {
                          return (
                            <Form.Item label="End Date" name="endOnDate" style={{ marginBottom: 12 }}>
                              <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                          )
                        }
                        if (ends === 'after') {
                          return (
                            <Form.Item label="Occurrences" name="endAfterCount" style={{ marginBottom: 12 }}>
                              <Input type="number" min={1} placeholder="1" />
                            </Form.Item>
                          )
                        }
                        return null
                      }}
                    </Form.Item>
                  </Col>
                </Row>
              )
            }}
          </Form.Item>

          <div className={style.subtitle}>Location Details</div>
          <Form.Item shouldUpdate noStyle>
            {() => {
              const typeId = selectedTypeId ?? form.getFieldValue('eventTypeId')
              const typeLabel = eventTypes.find(et => et.value === typeId)?.label?.toLowerCase()
              const isGame = typeLabel === 'game'
              
              // Auto set HOME for non-game events if location is not set
              if (!isGame && !form.getFieldValue('location')) {
                form.setFieldsValue({ location: 'HOME' })
              }
              
              return (
                <Form.Item name="location" rules={[{ required: true, message: 'Please select location' }]} style={{ marginBottom: 2 }}>
                  <TagSelector options={locations} />
                </Form.Item>
              )
            }}
          </Form.Item>
          <Form.Item name="venue" rules={[{ required: true, max: 255, message: 'Please enter venue name' }]} label="Venue Name">
            <Input placeholder="Enter venue name" />
          </Form.Item>

          <div className={style.subtitle}>Details</div>
          
          {/* Attendees Section - Show for Meeting, Practice, and Workout */}
          <Form.Item shouldUpdate noStyle>
            {() => {
              const typeId = selectedTypeId ?? form.getFieldValue('eventTypeId')
              const typeLabel = eventTypes.find(et => et.value === typeId)?.label?.toLowerCase()
              const showAttendees = typeLabel === 'meeting' || typeLabel === 'practice' || typeLabel === 'workout'
              
              if (!showAttendees) return null
              
              return (
                <Form.Item name="attendees" label="Attendees" style={{ marginBottom: 12 }}>
                  <Select
                    mode="multiple"
                    placeholder="Select Coaches to attend"
                    style={{ width: '100%' }}
                    options={[
                      { label: 'All Coaches', value: 'all_coaches' },
                      ...coaches,
                    ]}
                  />
                </Form.Item>
              )
            }}
          </Form.Item>

          {/* Show Opponent input only for games and scrimmages */}
          <Form.Item shouldUpdate noStyle>
            {() => {
              const typeId = selectedTypeId ?? form.getFieldValue('eventTypeId')
              const typeLabel = eventTypes.find(et => et.value === typeId)?.label?.toLowerCase()
              const showOpponent = typeLabel === 'game' || typeLabel === 'scrimmage'
              
              if (!showOpponent) return null
              
              return (
                <Form.Item name="oppositionTeam" label="Opponent" style={{ marginBottom: 12 }}>
                  <Input placeholder="Add Opponent" />
                </Form.Item>
              )
            }}
          </Form.Item>


          {/* Details text field - always visible and pre-populated based on event type */}
          <Form.Item name="notes" style={{ marginBottom: 12 }}>
            <Input.TextArea 
              placeholder="Enter event details..." 
              rows={3}
              onChange={(e) => {
                // Auto-populate based on event type when user starts typing
                const typeId = selectedTypeId ?? form.getFieldValue('eventTypeId')
                const typeLabel = eventTypes.find(et => et.value === typeId)?.label?.toLowerCase()
                
                if (e.target.value === '') {
                  // Only auto-populate if field is empty
                  let defaultText = ''

                  if (typeLabel === 'meeting' || typeLabel === 'workout' || typeLabel === 'practice') {
                     const attendees = form.getFieldValue('attendees')
                     if (attendees && attendees.length > 0) {
                       // Check if "All Coaches" is selected
                       if (attendees.includes('all_coaches')) {
                         defaultText = 'Attendees: All Coaches'
                       } else {
                         const attendeeLabels = attendees.map((attendeeId: string) => {
                           const coach = coaches.find(c => c.value === attendeeId)
                           return coach ? coach.label : attendeeId
                         })
                         defaultText = `Attendees: ${attendeeLabels.join(', ')}`
                       }
                     } else {
                       defaultText = 'Attendees: '
                     }
                   } else if (typeLabel === 'game' || typeLabel === 'scrimmage') {
                     const opponent = form.getFieldValue('oppositionTeam')
                     defaultText = opponent ? `Opponent: ${opponent}` : 'Opponent: '
                   }

                   if (defaultText) {
                     form.setFieldsValue({ notes: defaultText })
                   }
                 }
               }}
             />
           </Form.Item>

          <Button type="primary" htmlType="submit"  block style={{ marginTop: 24 }} loading={loading}>
            Save
          </Button>
        </Form>
      </Drawer>
      <NewEventType isShowModal={isShowModalNewType} showModal={showModalNewType} refreshEventType={refreshEventType} />
    </>
  )
}

export default memo(EditEvent)