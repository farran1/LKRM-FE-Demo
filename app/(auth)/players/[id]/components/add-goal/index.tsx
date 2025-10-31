import { App, Button, Drawer, Flex, Form, Input } from 'antd'
import { memo, useCallback, useEffect, useState } from 'react'
import style from './style.module.scss'
import CloseIcon from '@/components/icon/close.svg'
import api from '@/services/api'
import { MAX_GOAL } from '@/utils/constants'
import NoteList from '@/components/note-list'

function AddGoal({ goals, player, isOpen, showOpen, onRefresh }: any) {
  // Don't render if player is not available - check before hooks
  if (!player || !player.id) {
    return null
  }

  const [goal, setGoal] = useState('')
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()
  const { message } = App.useApp()

  const saveGoal = useCallback(async () => {
    if (!goal.trim() || !player?.id) return
    setSaving(true)
    try {
      const response = await api.post(`/api/players/${player.id}/goals`, { 
        title: goal.trim(),
        description: ''
      })
      console.log('Goal save response:', response)
      // Ensure the UI refreshes before notifying
      await Promise.resolve(onRefresh && onRefresh())
      message.success('Goal saved!')
      setGoal('')
    } catch (error: any) {
      console.error('Error saving goal:', error)
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to save goal'
      message.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }, [goal, player?.id, onRefresh, message])

  const handleChangeGoal = (e: any) => {
    setGoal(e.target.value)
  }

  const onClose = () => {
    showOpen(false)
    setGoal('')
  }

  const handleSaveNow = async () => {
    if (!goal.trim()) {
      message.warning('Please enter a goal to save')
      return
    }
    await saveGoal()
  }

  const handleGoalDeleted = useCallback((goalId: number) => {
    // Refresh the goals list when a goal is deleted
    onRefresh()
  }, [onRefresh])

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
        <div className={style.title}>Goals</div>
        <CloseIcon onClick={onClose} />
      </Flex>
      
      <Form layout="vertical" form={form}>
        <Flex justify='space-between' align='center' style={{ marginBottom: 12 }}>
          <div className={style.subtitle}>Add New Goal</div>
          <Button 
            className={style.btnOutline} 
            onClick={handleSaveNow}
            disabled={!goal.trim() || saving}
            loading={saving}
          >
            Save
          </Button>
        </Flex>
        
        <Form.Item label="Goal" style={{ marginBottom: 0 }}>
          <Input.TextArea 
            rows={3} 
            placeholder="Enter Goal here" 
            style={{ borderColor: 'rgba(237, 237, 237, 0.3)' }} 
            value={goal} 
            onChange={handleChangeGoal} 
          />
        </Form.Item>

        {goals && goals.length > 0 && (
          <>
            <div className={style.subtitle} style={{ marginTop: 16 }}>Previous Goals</div>
            <NoteList 
              notes={goals} 
              onNoteDeleted={handleGoalDeleted}
              playerId={player.id}
              itemType="goal"
            />
          </>
        )}
      </Form>
    </Drawer>
  )
}

export default memo(AddGoal)