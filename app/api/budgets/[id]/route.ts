import { NextRequest, NextResponse } from 'next/server'
import { fetcher } from '../../../../src/services/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await fetcher(`/api/budgets/${id}`)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching budget:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budget' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    // Our fetcher only supports GET; call routePut via api instead
    const resp = await fetch(`/api/budgets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await resp.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating budget:', error)
    return NextResponse.json(
      { error: 'Failed to update budget' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const resp = await fetch(`/api/budgets/${id}`, { method: 'DELETE' })
    const data = await resp.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error deleting budget:', error)
    return NextResponse.json(
      { error: 'Failed to delete budget' },
      { status: 500 }
    )
  }
}
