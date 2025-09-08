'use client';

import { useState } from 'react';
import { Drawer, Form, Input, Select, InputNumber, Switch, Button, Flex, App } from 'antd';
import CloseIcon from '@/components/icon/close.svg';
import style from './style.module.scss';

const { TextArea } = Input;

interface CreateBudgetDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateBudgetDrawer({ open, onClose, onSuccess }: CreateBudgetDrawerProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          season: '2025-2026',
          createdBy: 1, // TODO: Get from actual user context
          updatedBy: 1
        }),
      });

      if (response.ok) {
        message.success('Budget created successfully!');
        form.resetFields();
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        message.error(errorData.error || 'Failed to create budget');
      }
    } catch (error) {
      console.error('Error creating budget:', error);
      message.error('Failed to create budget');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Drawer
      destroyOnHidden
      className={style.drawer}
      width={548}
      onClose={handleCancel}
      open={open}
      styles={{
        body: {
          paddingBottom: 24,
        },
      }}
    >
      <Flex className={style.header} justify="space-between" align='flex-end' style={{ marginBottom: 24 }}>
        <div className={style.title}>New Budget</div>
        <CloseIcon onClick={handleCancel} />
      </Flex>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          period: 'Yearly',
          autoRepeat: true
        }}
      >
        <Form.Item
          name="name"
          label="Budget Name"
          rules={[{ required: true, message: 'Please enter a budget name' }]}
        >
          <Input placeholder="e.g., Equipment Maintenance" />
        </Form.Item>

        <Form.Item
          name="amount"
          label="Budget Amount"
          rules={[{ required: true, message: 'Please enter the budget amount' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="0.00"
            min={0}
            step={0.01}
            prefix="$"
          />
        </Form.Item>

        <Flex gap={16}>
          <Form.Item
            name="period"
            label="Budget Period"
            rules={[{ required: true, message: 'Please select a budget period' }]}
            style={{ flex: 2 }}
          >
            <Select placeholder="Select a period">
              <Select.Option value="Monthly">Monthly</Select.Option>
              <Select.Option value="Quarterly">Quarterly</Select.Option>
              <Select.Option value="Semester">Semester</Select.Option>
              <Select.Option value="Yearly">Yearly</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="autoRepeat"
            label="Auto-Repeat"
            valuePropName="checked"
            style={{ flex: 1 }}
          >
            <Switch />
          </Form.Item>
        </Flex>

        <Form.Item
          name="description"
          label="Description"
        >
          <TextArea 
            rows={3} 
            placeholder="Optional description of what this budget covers..."
          />
        </Form.Item>

        <Button 
          type="primary" 
          htmlType="submit" 
          block 
          style={{ marginTop: 24 }} 
          loading={loading}
        >
          Create Budget
        </Button>
      </Form>
    </Drawer>
  );
}
