import { Button, ColorPicker, Flex, Form, Input, Modal } from 'antd'
import { memo, useState } from 'react'
import style from './style.module.scss'
import CloseIcon from '@/components/icon/close.svg'
import api from '@/services/api'

function NewEventType({isShowModal, showModal, refreshEventType}: any) {
  const [loading, setLoading] = useState(false)

  const onSubmit = async (payload: any) => {
    setLoading(true)
    try {
      const res = await api.post('/api/eventTypes', payload)
      showModal(false)
      refreshEventType()
    } catch (error) {
    }
    setLoading(false)
  }

  const onClose = () => {
    showModal(false)
  }

  return (
    <Modal
      // closable={{ 'aria-label': 'Custom Close Button' }}
      closeIcon={null}
      open={isShowModal}
      footer={null}
      className={style.container}
      destroyOnHidden
      maskClosable={true}
      onCancel={onClose}
    >
      <Flex className={style.header} justify="space-between" align='flex-end' style={{ marginBottom: 32 }}>
        <div className={style.title} >New Event Type</div>
        <CloseIcon onClick={onClose} />
      </Flex>
      <Form onFinish={onSubmit} initialValues={{ color: '#1677ff', txtColor: '#fff' }}>
        <Form.Item name="name" rules={[{ required: true, max: 255 }]} label="Name">
          <Input placeholder="Enter Event Type Name" />
        </Form.Item>
        <Form.Item name="txtColor" rules={[{ required: true }]} label="Text color" getValueFromEvent={(txtColor) => "#" + txtColor.toHex()}>
          <ColorPicker showText />
        </Form.Item>
        <Form.Item name="color" rules={[{ required: true }]} label="Background color" getValueFromEvent={(color) => "#" + color.toHex()}>
          <ColorPicker showText />
        </Form.Item>
        <Button type="primary" htmlType="submit" block disabled={loading}>
          Save
        </Button>
      </Form>
    </Modal>
  )
}

export default memo(NewEventType)