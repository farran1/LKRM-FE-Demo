import { App, Button, Drawer, Flex, Form, Input } from 'antd'
import { memo, useCallback, useEffect, useState } from 'react'
import style from './style.module.scss'
import CloseIcon from '@/components/icon/close.svg'
import api from '@/services/api'
import { MAX_GOAL } from '@/utils/constants'
import NoteList from '@/components/note-list'

function AddGoal({ goals, player, isOpen, showOpen, onRefresh } : any) {
  const [goal, setGoal] = useState('')
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const { message } = App.useApp()

  const [goalList, setGoalList] = useState<Array<any>>([])

  useEffect(() => {
    setGoalList(goals)
  }, [goals])

  const onClose = () => {
    showOpen(false)
    reset()
    setLoading(false)
  }

  const onSubmit = async () => {
    const payload = {
      goals: goalList.map(item => item.note)
    }
    setLoading(true)
    try {
      const res = await api.post(`/api/players/${player.id}/goals`, payload)
      onRefresh()
      onClose()
    } catch (error) {
    }
    setLoading(false)
  }

  const reset = () => {
    setGoal('')
  }

  const handleChangeGoal = (e: any) => {
    setGoal(e.target.value);
  }

  const addGoal = () => {
    if (!goal.trim()) return
    if (goalList.length >= MAX_GOAL) {
      message.error(`You can only add up to ${MAX_GOAL} goals.`)
      return
    }
    setGoalList([...goalList, { note: goal }])
    setGoal('')
  }

  const deleteGoal = useCallback((itemIndex: number) => {
    const newgoalList = goalList.filter((_: any, index: number) => index !== itemIndex)
    setGoalList(newgoalList)
  }, [goalList])

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
          <div className={style.title} >Goals</div>
          <CloseIcon onClick={onClose} />
        </Flex>
        <Form layout="vertical" form={form} onFinish={onSubmit}>
          <Flex justify='space-between' align='center' style={{ marginBottom: 12 }}>
            <div className={style.subtitle}>Add New Goal</div>
            <Button className={style.btnOutline} onClick={addGoal}>Add</Button>
          </Flex>
          <Form.Item label="Goal" style={{ marginBottom: 0 }}>
            <Input.TextArea rows={3} placeholder="Enter Goal here" style={{ borderColor: 'rgba(237, 237, 237, 0.3)' }} value={goal} onChange={handleChangeGoal} />
          </Form.Item>

          {goalList.length > 0 &&
            <>
              <div className={style.subtitle} style={{ marginTop: 16 }}>Previous Goals</div>
              <NoteList notes={goalList} deleteNote={deleteGoal} />
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

export default memo(AddGoal)