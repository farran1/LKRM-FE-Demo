import { App, Button, Drawer, Flex, Form, Input, Modal } from 'antd'
import { memo, useCallback, useEffect, useState } from 'react'
import style from './style.module.scss'
import CloseIcon from '@/components/icon/close.svg'
import api from '@/services/api'
import { MAX_GOAL } from '@/utils/constants'
import NoteList from '@/components/note-list'

function AddGoal({ goals, player, isOpen, showOpen, onRefresh } : any) {
  const [goal, setGoal] = useState('')
  const [loading, setLoading] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [form] = Form.useForm()
  const { message } = App.useApp()

  const [goalList, setGoalList] = useState<Array<any>>([])
  const [originalGoals, setOriginalGoals] = useState<Array<any>>([])

  // Don't render if player is not available
  if (!player || !player.id) {
    return null
  }

  useEffect(() => {
    setGoalList(goals || [])
    setOriginalGoals(goals || [])
  }, [goals])

  // Auto-save functionality (only when closing)
  const autoSaveGoal = useCallback(async (goalText: string) => {
    if (!goalText.trim() || !player?.id) return
    
    setAutoSaving(true)
    try {
      const payload = {
        goal: goalText.trim()
      }
      await api.post(`/api/players/${player.id}/goals`, payload)
      message.success('Goal auto-saved!')
      onRefresh() // Refresh the goals list
    } catch (error) {
      message.error('Failed to auto-save goal')
      console.error('Error auto-saving goal:', error)
    } finally {
      setAutoSaving(false)
    }
  }, [player?.id, onRefresh, message])

  const handleChangeGoal = (e: any) => {
    setGoal(e.target.value)
  }

  const onClose = () => {
    // Auto-save any remaining text before closing
    if (goal.trim() && player?.id) {
      autoSaveGoal(goal)
    }
    showOpen(false)
    reset()
    setLoading(false)
  }

  const onSubmit = async () => {
    if (!player?.id) return
    
    setLoading(true)
    try {
      // Auto-add the current goal if there's text in the textarea
      let goalsToSave = [...goalList]
      if (goal.trim() && !goalList.some(item => item.note === goal.trim())) {
        goalsToSave = [...goalList, { note: goal.trim() }]
      }
      
      // Only save new goals (not existing ones)
      const newGoals = goalsToSave.slice(originalGoals.length)
      
      for (const goalItem of newGoals) {
        const payload = {
          goal: goalItem.note  // the goal text is stored in 'note' field
        }
        await api.post(`/api/players/${player.id}/goals`, payload)
      }
      
      if (newGoals.length > 0) {
        message.success(`${newGoals.length} goal(s) added successfully`)
      } else {
        message.info('No new goals to save')
      }
      
      onRefresh()
      onClose()
    } catch (error) {
      message.error('Failed to save goals')
      console.error('Error saving goals:', error)
    }
    setLoading(false)
  }

  const reset = () => {
    setGoal('')
    setGoalList(originalGoals) // Reset to original goals only
  }

  const handleClearAll = () => {
    Modal.confirm({
      title: 'Clear All Goals?',
      content: 'Are you sure you want to clear all goals? This action cannot be undone.',
      okText: 'Yes, Clear All',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        reset()
        message.success('All goals cleared')
      }
    })
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
            <Input.TextArea 
              rows={3} 
              placeholder="Enter Goal here (auto-saves when closing)" 
              style={{ borderColor: 'rgba(237, 237, 237, 0.3)' }} 
              value={goal} 
              onChange={handleChangeGoal} 
            />
            {autoSaving && (
              <div style={{ fontSize: '12px', color: '#52c41a', marginTop: '4px' }}>
                Auto-saving...
              </div>
            )}
          </Form.Item>

          {goalList.length > 0 &&
            <>
              <div className={style.subtitle} style={{ marginTop: 16 }}>Previous Goals</div>
              <NoteList notes={goalList} deleteNote={deleteGoal} />
            </>
          }

          <Flex style={{ marginTop: 60 }} gap={8}>
            <Button block onClick={handleClearAll}>
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