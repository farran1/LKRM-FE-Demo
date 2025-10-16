'use client';

import { useState, useEffect } from 'react';
import { Drawer, Form, Input, Select, InputNumber, Switch, Button, Flex, App } from 'antd';
import CloseIcon from '@/components/icon/close.svg';
import style from '../CreateBudgetDrawer/style.module.scss';

const { TextArea } = Input;

interface EditBudgetDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  budget: {
    id: number;
    title: string;
    totalBudget: number;
    period: string;
    description?: string;
    autoRepeat: boolean;
    season: string;
    is_pinned: boolean;
  } | null;
}

export default function EditBudgetDrawer({ open, onClose, onSuccess, budget }: EditBudgetDrawerProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  // Populate form when budget changes
  useEffect(() => {
    if (budget && open) {
      form.setFieldsValue({
        name: budget.title,
        amount: budget.totalBudget,
        period: budget.period,
        description: budget.description || '',
        autoRepeat: budget.autoRepeat,
        is_pinned: budget.is_pinned
      });
    }
  }, [budget, open, form]);

  const handleSubmit = async (values: any) => {
    if (!budget) return;
    
    try {
      setLoading(true);
      
      const requestData = {
        ...values,
        season: budget.season,
        updatedBy: 1 // TODO: Get from actual user context
      };
      
      console.log('EditBudgetDrawer - Sending data:', requestData);
      
      const response = await fetch(`/api/budgets/${budget.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('EditBudgetDrawer - Response status:', response.status);
      console.log('EditBudgetDrawer - Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('EditBudgetDrawer - Success response:', responseData);
        message.success('Budget updated successfully!');
        form.resetFields();
        onSuccess();
        onClose();
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.error('EditBudgetDrawer - Failed to parse error response:', parseError);
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error('EditBudgetDrawer - Error response:', errorData);
        message.error(errorData.error || 'Failed to update budget');
      }
    } catch (error) {
      console.error('Error updating budget:', error);
      message.error('Failed to update budget');
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
      width={400}
      onClose={handleCancel}
      open={open}
      styles={{
        body: {
          paddingBottom: 24,
        },
      }}
    >
      <Flex className={style.header} justify="space-between" align='flex-end' style={{ marginBottom: 24 }}>
        <div className={style.title}>Edit Bucket</div>
        <CloseIcon onClick={handleCancel} />
      </Flex>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          period: 'Season',
          autoRepeat: true
        }}
      >
        <Form.Item
          name="name"
          label="Bucket Name"
          rules={[{ required: true, message: 'Please enter a bucket name' }]}
        >
          <Input placeholder="e.g., Equipment Maintenance" />
        </Form.Item>

        <Form.Item
          name="amount"
          label="Bucket Amount"
          rules={[{ required: true, message: 'Please enter the bucket amount' }]}
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
            label="Bucket Period"
            rules={[{ required: true, message: 'Please select a bucket period' }]}
            style={{ flex: 2 }}
          >
            <Select placeholder="Select a period">
              <Select.Option value="Monthly">Monthly</Select.Option>
              <Select.Option value="Quarterly">Quarterly</Select.Option>
              <Select.Option value="Semester">Semester</Select.Option>
              <Select.Option value="Season">Season</Select.Option>
            </Select>
          </Form.Item>
        </Flex>

        <Form.Item
          name="description"
          label="Description"
        >
          <TextArea 
            rows={3} 
            placeholder="Optional description of what this bucket covers..."
          />
        </Form.Item>


        <Button 
          type="primary" 
          htmlType="submit" 
          block 
          style={{ marginTop: 24 }} 
          loading={loading}
        >
          Update Bucket
        </Button>
      </Form>
    </Drawer>
  );
}






