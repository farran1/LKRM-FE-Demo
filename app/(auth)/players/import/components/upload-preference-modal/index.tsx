import { App, Button, ColorPicker, Flex, Form, Input, Modal, Radio } from 'antd'
import { memo, useEffect, useState } from 'react'
import style from './style.module.scss'
import api from '@/services/api'

function UploadPreferenceModal({importId, isShowModal, showModal, onRefresh}: any) {
  const [loading, setLoading] = useState(false)
  const { notification } = App.useApp()

  const onSubmit = async (payload: any) => {
    if (!importId) {
      return
    }

    payload.importId = importId

    setLoading(true)
    try {
      const res = await api.post('/api/players/import', payload)
      onClose()
      onRefresh()

      const total = res.data?.total || 0
      notification.success({
        message: 'Success',
        description: `You imported ${total} Players successfully!`
      })
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
      <Flex className={style.header} justify="space-between" align='flex-end'>
        <div className={style.title} >Upload Preference</div>
      </Flex>
      <Form onFinish={onSubmit} initialValues={{ option: 'merge' }}>
        {/* <Form.Item name="name" rules={[{ required: true, max: 255 }]} label="Name">
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
        </Button> */}
        <Form.Item name="option" rules={[{ required: true, message: 'Please select an option!' }]} style={{ marginBottom: 16 }} >
          <Radio.Group className={style.radioGroup}>
            <div className={style.option}>
              <Radio value="merge" />
              <div>
                <div className={style.optionTitle}>Merge Data</div>
                <div className={style.optionDesc}>Add new data in the existing list.</div>
              </div>
            </div>
            <div className={style.option}>
              <Radio value="overwrite" />
              <div>
                <div className={style.optionTitle}>Overwrite Data</div>
                <div className={style.optionDesc}>Delete all previous list and replace with this one.</div>
              </div>
            </div>
          </Radio.Group>
        </Form.Item>
        <Flex gap={10}>
          <Button onClick={onClose} className={style.btnCancel}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" block disabled={loading}>
            Continue
          </Button>
        </Flex>
      </Form>
    </Modal>
  )
}

export default memo(UploadPreferenceModal

)