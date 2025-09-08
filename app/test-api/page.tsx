'use client'

import { useState } from 'react'

export default function TestAPIPage() {
	const [result, setResult] = useState('')
	const [loading, setLoading] = useState(false)

	const testGET = async () => {
		setLoading(true)
		try {
			const res = await fetch('/api/test-route')
			const data = await res.json()
			setResult(`GET Response: ${JSON.stringify(data, null, 2)}`)
		} catch (error) {
			setResult(`GET Error: ${error}`)
		}
		setLoading(false)
	}

	const testPOST = async () => {
		setLoading(true)
		try {
			const res = await fetch('/api/test-route', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ test: 'data' })
			})
			const data = await res.json()
			setResult(`POST Response: ${JSON.stringify(data, null, 2)}`)
		} catch (error) {
			setResult(`POST Error: ${error}`)
		}
		setLoading(false)
	}

	return (
		<div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
			<h1>API Route Test Page</h1>
			<p>This page tests if new API routes are working.</p>
			
			<div style={{ marginBottom: '20px' }}>
				<button 
					onClick={testGET} 
					disabled={loading}
					style={{ marginRight: '10px', padding: '10px 20px' }}
				>
					Test GET /api/test-route
				</button>
				
				<button 
					onClick={testPOST} 
					disabled={loading}
					style={{ padding: '10px 20px' }}
				>
					Test POST /api/test-route
				</button>
			</div>

			{loading && <p>Testing...</p>}
			
			{result && (
				<div style={{ 
					backgroundColor: '#f5f5f5', 
					padding: '15px', 
					borderRadius: '5px',
					fontFamily: 'monospace',
					whiteSpace: 'pre-wrap'
				}}>
					{result}
				</div>
			)}

			<hr style={{ margin: '30px 0' }} />
			
			<h2>What This Tests:</h2>
			<ul>
				<li>If Next.js can recognize new API routes</li>
				<li>If the routing system is working at all</li>
				<li>If there's a broader Next.js configuration issue</li>
			</ul>

			<h2>Expected Results:</h2>
			<ul>
				<li><strong>If it works:</strong> You'll see the API response data</li>
				<li><strong>If it doesn't work:</strong> You'll get an error, which will help us diagnose the issue</li>
			</ul>
		</div>
	)
}
