import { Button, Col, DatePicker, Drawer, Flex, Form, Input, Row, Select, Switch, TimePicker, Typography } from 'antd'
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
  const [eventTypes, setEventTypes] = useState([])
  const [isShowModalNewType, showModalNewType] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    getEventTypes()
  }, [])

  async function getEventTypes() {
    setLoading(true)
    const res = await api.get('/api/eventTypes')
    if (res?.data?.data.length > 0) {
      const types = res?.data?.data.map((item: any) => ({label: item.name, value: item.id}))
      setEventTypes(types)
    }
    setLoading(false)
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

    setLoading(true)
    try {
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
        <Form layout="vertical" onFinish={onSubmit} initialValues={{ isRepeat: false }} form={form}>
          <Form.Item name="name" rules={[{ required: true, max: 255 }]} label="Name">
            <Input placeholder="Enter Event Name" />
          </Form.Item>
          <Form.Item name="eventTypeId" rules={[{ required: true, message: 'Please select Event type' }]} label={eventTypeTitle} style={{ marginBottom: 14 }}>
            <TagSelector options={eventTypes} />
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
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Repeats?" name="isRepeat">
                <Select>
                  <Select.Option value={false}>Does not Repeat</Select.Option>
                  <Select.Option value={true}>Repeat</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Occurences" name="occurence">
                <Input type="number" placeholder="0" />
              </Form.Item>
            </Col>
          </Row>

          <div className={style.subtitle}>Location Details</div>
          <Form.Item name="location" rules={[{ required: true, message: 'Please select location' }]} style={{ marginBottom: 2 }}>
            <TagSelector options={locations} />
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