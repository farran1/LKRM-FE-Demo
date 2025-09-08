import { App, Button, Drawer, Flex, Form, Input, Select } from 'antd'
import { memo, useEffect, useState } from 'react'
import style from './style.module.scss'
import CloseIcon from '@/components/icon/close.svg'
import api from '@/services/api'

function EditPlayer({ player, isOpen, showOpen, onRefresh } : any) {
  const [loading, setLoading] = useState(false)
  const [positions, setPositions] = useState<Array<{id: number, name: string}>>([])
  const { message } = App.useApp()
  const [form] = Form.useForm()


  useEffect(() => {
    getPositions()
  }, [])

  useEffect(() => {
    if (!player || !form) return

    // Set form values to match the new structure
    form.setFieldsValue({
      firstName: player.first_name || '',
      lastName: player.last_name || '',
      positionId: player.positionId,
      jersey: player.jersey_number || player.jersey || '',
      schoolYear: player.school_year || ''
    })
  }, [player, form])

  async function getPositions() {
    const res = await api.get('/api/positions')
    if ((res as any)?.data?.data?.length > 0) {
      const types = (res as any)?.data?.data.map((item: any) => ({label: item.name, value: item.id}))
      setPositions(types)
    }
  }

  const onClose = () => {
    showOpen(false)
    reset()
    setLoading(false)
  }

  const onSubmit = async (payload: any) => {
    setLoading(true)
    try {
      // Prepare player data to match the new structure
      const playerData = {
        name: `${payload.firstName} ${payload.lastName}`.trim(),
        firstName: payload.firstName,
        lastName: payload.lastName,
        position_id: payload.positionId,
        jersey_number: payload.jersey,
        school_year: payload.schoolYear
      }

      console.log('Updating player with data:', playerData)
      const res = await api.put('/api/players/' + player.id, playerData)
      
      if (res.status === 200) {
        message.success('Player updated successfully!')
        onClose()
        onRefresh()
      } else {
        message.error('Failed to update player. Please try again.')
      }
    } catch (error: any) {
      console.error('Error updating player:', error)
      if (error.response?.data?.message) {
        message.error(`Update failed: ${error.response.data.message}`)
      } else {
        message.error('Failed to update player. Please try again.')
      }
    }
    setLoading(false)
  }

  const reset = () => {
    form.setFieldsValue({
      firstName: player?.first_name || '',
      lastName: player?.last_name || '',
      positionId: player?.positionId,
      jersey: player?.jersey_number || player?.jersey || '',
      schoolYear: player?.school_year || ''
    })
  }

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
          <div className={style.title} >Edit Profile</div>
          <CloseIcon onClick={onClose} />
        </Flex>
        <Form layout="vertical" form={form} onFinish={onSubmit}>
          <div style={{ marginBottom: 16 }}>Player Information</div>
          
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
          <Flex style={{ marginTop: 60 }} gap={8}>
            <Button block onClick={reset}>
              Reset all
            </Button>
            <Button type="primary" htmlType="submit"  block loading={loading}>
              Update
            </Button>
          </Flex>
        </Form>
    </Drawer>
  )
}

export default memo(EditPlayer)