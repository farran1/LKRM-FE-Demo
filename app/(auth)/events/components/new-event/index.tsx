import { Button, Col, DatePicker, Drawer, Flex, Form, Input, Row, Select, Switch, TimePicker, Typography, Radio, Checkbox } from 'antd'
import { memo, useEffect, useMemo, useState } from 'react'
import CloseIcon from '@/components/icon/close.svg'
import style from './style.module.scss'
import TagSelector from '@/components/tag-selector'
import api from '@/services/api'
import { convertDateTime } from '@/utils/app'
import { PlusOutlined } from '@ant-design/icons'
import NewEventType from '../new-event-type'
import { locations } from '@/utils/constants'

const { Title } = Typography

function NewEvent({ isOpen, showOpen, onRefresh } : any) {
  const [loading, setLoading] = useState(false)
  const [eventTypes, setEventTypes] = useState<{ label: string; value: number }[]>([])
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null)
  const [isShowModalNewType, showModalNewType] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    getEventTypes()
  }, [])

  async function getEventTypes() {
    setLoading(true)
    try {
      const res = await api.get('/api/eventTypes')
      const existing: { label: string; value: number }[] = Array.isArray(res?.data?.data)
        ? res.data.data.map((item: any) => ({ label: item.name, value: item.id }))
        : []

      const defaults = [
        { name: 'Practice',   color: '#2196f3', txtColor: '#ffffff' },
        { name: 'Game',       color: '#4ecdc4', txtColor: '#ffffff' },
        { name: 'Workout',    color: '#9c27b0', txtColor: '#ffffff' },
        { name: 'Meeting',    color: '#4caf50', txtColor: '#ffffff' },
        { name: 'Scrimmage',  color: '#ff9800', txtColor: '#ffffff' },
        { name: 'Tournament', color: '#ff5722', txtColor: '#ffffff' },
      ]

      // Seed any missing default types on the backend
      const lowerExisting = new Set(existing.map(t => t.label.toLowerCase()))
      const missing = defaults.filter(d => !lowerExisting.has(d.name.toLowerCase()))
      if (missing.length > 0) {
        await Promise.all(
          missing.map(async d => {
            try {
              await api.post('/api/eventTypes', { name: d.name, color: d.color, txtColor: d.txtColor })
            } catch (e) {
              // ignore conflicts/authorization issues; we still merge UI below
            }
          })
        )
      }

      // Re-fetch to get IDs for seeded types
      let merged = existing
      try {
        const res2 = await api.get('/api/eventTypes')
        if (Array.isArray(res2?.data?.data) && res2.data.data.length > 0) {
          merged = res2.data.data.map((item: any) => ({ label: item.name, value: item.id }))
        }
      } catch {}

      // Ensure all default labels are present even if backend blocked seeding
      const ensureAll = new Map<string, { label: string; value: number }>()
      merged.forEach(t => ensureAll.set(t.label.toLowerCase(), t))
      defaults.forEach((d, idx) => {
        const key = d.name.toLowerCase()
        if (!ensureAll.has(key)) {
          // Use synthetic negative id so UI shows it; selection will attempt to create on submit
          ensureAll.set(key, { label: d.name, value: -(idx + 1) })
        }
      })

      setEventTypes(Array.from(ensureAll.values()))
    } finally {
      setLoading(false)
    }
  }

  const onClose = () => {
    reset()
    showOpen(false)
  }

  const onSubmit = async (payload: any) => {
    // showOpen(false)
    // return
    const startTime = convertDateTime(payload.startDate, payload.startTime)
    let endTime = undefined
    if (payload.endDate && payload.endTime) {
      endTime = convertDateTime(payload.endDate, payload.endTime)
    }

    delete payload.startDate
    delete payload.endDate
    payload.startTime = startTime
    payload.endTime = endTime

    // Recurrence mapping (Google/Outlook/Apple style → current API)
    const repeatRule = payload.repeatRule // none | daily | weekly | monthly | yearly
    const endsType = payload.endsType // never | on | after
    const endOnDate = payload.endOnDate
    const endAfterCount = payload.endAfterCount

    if (repeatRule && repeatRule !== 'none') {
      payload.isRepeat = true
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
      delete payload.occurence
    }

    // Clean UI-only fields
    delete payload.repeatRule
    delete payload.endsType
    delete payload.endOnDate
    delete payload.endAfterCount
    delete payload.daysOfWeek

    setLoading(true)
    try {
      // If selected eventType has a synthetic id (negative), try to create it first
      if (typeof payload.eventTypeId === 'number' && payload.eventTypeId < 0) {
        const selected = eventTypes.find(e => e.value === payload.eventTypeId)
        if (selected) {
          // Pick colors consistent with defaults
          const palette: Record<string, { color: string; txtColor: string }> = {
            practice: { color: '#2196f3', txtColor: '#ffffff' },
            game: { color: '#4ecdc4', txtColor: '#ffffff' },
            workout: { color: '#9c27b0', txtColor: '#ffffff' },
            meeting: { color: '#4caf50', txtColor: '#ffffff' },
            scrimmage: { color: '#ff9800', txtColor: '#ffffff' },
            tournament: { color: '#ff5722', txtColor: '#ffffff' },
          }
          const key = selected.label.toLowerCase()
          try {
            const colors = palette[key] ?? { color: '#1890ff', txtColor: '#ffffff' }
            const createRes = await api.post('/api/eventTypes', { name: selected.label, ...colors })
            const newId = createRes?.data?.id
            if (newId) {
              payload.eventTypeId = newId
            }
          } catch {}
        }
      }
      const res = await api.post('/api/events', payload)
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

  function reset() {
    form.resetFields()
  }

  return (
    <>
      <Drawer
        destroyOnHidden
        // loading={loading}
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
          <div className={style.title} >New Event</div>
          <CloseIcon onClick={onClose} />
        </Flex>
        <Form layout="vertical" onFinish={onSubmit} initialValues={{ repeatRule: 'none', endsType: 'never', endAfterCount: 1, location: 'HOME' }} form={form}>
          <Form.Item name="name" rules={[{ required: true, max: 255 }]} label="Name">
            <Input placeholder="Enter Event Name" />
          </Form.Item>
          <Form.Item name="eventTypeId" rules={[{ required: true, message: 'Please select Event type' }]} label={eventTypeTitle} style={{ marginBottom: 14 }}>
            <TagSelector 
              options={eventTypes}
              onChange={(val: any) => {
                const numeric = typeof val === 'string' ? Number(val) : val
                setSelectedTypeId(numeric)
                // Auto-fill location rules: Workout -> HOME, Game -> keep prior, else untouched
                const selectedLabel = eventTypes.find(et => et.value === numeric)?.label?.toLowerCase()
                if (selectedLabel?.includes('workout')) {
                  form.setFieldsValue({ location: 'HOME' })
                }
                if (selectedLabel === 'game') {
                  // Leave as-is but ensure field exists
                  if (!form.getFieldValue('location')) form.setFieldsValue({ location: 'HOME' })
                }
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
              if (!isGame) {
                // Auto set HOME for non-game workouts explicitly
                if (typeLabel?.includes('workout')) {
                  if (form.getFieldValue('location') !== 'HOME') form.setFieldsValue({ location: 'HOME' })
                }
                return null
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

          <div className={style.subtitle}>Team & Notifications</div>
          <Form.Item name="members" label="Team Members" style={{ marginBottom: 12 }}>
            <Input placeholder="Add team member" />
          </Form.Item>
          <Flex align="flex-end" justify="space-between" style={{ marginBottom: 24 }}>
            <div>Notify Team?</div>
            <Form.Item name="isNotice" style={{ margin: 0 }}>
              <Switch />
            </Form.Item>
          </Flex>

          <Form.Item name="oppositionTeam" label="Opposition Team">
            <Input placeholder="Add Opposition Team" />
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

export default memo(NewEvent)