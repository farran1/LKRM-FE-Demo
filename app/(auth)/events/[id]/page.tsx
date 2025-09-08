import { Metadata } from 'next'
import Page from './event-detail'
import { Suspense } from 'react'
import { cookies } from 'next/headers';
import api from '@/services/api';
import { AxiosError } from 'axios';

async function fetchEvent(eventId: number | string): Promise<any> {
  // For static export, return mock data instead of making API calls
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PHASE === 'phase-production-build') {
    return {
      id: eventId,
      name: `Event ${eventId}`,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      eventTypeId: 1,
      eventType: {
        id: 1,
        name: 'Game',
        color: '#3B82F6',
        txtColor: '#FFFFFF'
      },
      location: 'HOME' as const,
      venue: 'Main Court',
      isRepeat: false,
      occurence: 0,
      isNotice: false,
      oppositionTeam: null,
      createdAt: new Date().toISOString(),
      createdBy: 1,
      updatedAt: new Date().toISOString(),
      updatedBy: 1
    };
  }

  const cookieStore = await cookies();
  try {
    // Extract original event ID from composite IDs like "17-0"
    const originalEventId = String(eventId).split('-')[0]
    const res = await api.get(`/api/events/${originalEventId}`);
    return (res as any).data.event
  } catch(error) {
    if (error instanceof AxiosError) {
      console.log('Axios error:', error.response?.status, error.response?.data);
    } else {
      console.log('Unexpected error:', error);
    }
  }

  return null
}

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Generate static params for static export
export async function generateStaticParams() {
  // For demo purposes, generate a few common event IDs
  // In a real app, you'd fetch this from your API
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' },
  ]
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { id } = await params
   const event: any = await fetchEvent(id)

  if (!event)
    return {
      title: 'Login Required | | LKRM',
      description: 'Please log in to view this event details.',
    };

  return {
    title: event.name + ' | LKRM',
    description: event.name,
    openGraph: {
      title: event.name,
      description: event.name,
    },
  }
}

export default async function({ params }: Props) {
  const { id } = await params
  return (
    <Suspense>
      <Page eventId={id}/>
    </Suspense>
  )
}
