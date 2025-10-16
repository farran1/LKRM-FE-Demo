'use client'

import React from 'react'
import { Badge } from 'antd'
import { BellOutlined } from '@ant-design/icons'

type NotificationBellProps = {
	count?: number
	onClick?: () => void
}

export default function NotificationBell({ count = 0, onClick }: NotificationBellProps) {
	return (
		<Badge count={count} size="small" overflowCount={99}>
			<BellOutlined
				style={{ fontSize: 18, color: '#ffffff', cursor: 'pointer' }}
				onClick={onClick}
			/>
		</Badge>
	)
}


