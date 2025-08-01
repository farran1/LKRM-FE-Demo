import { Metadata } from 'next'
import Page from './event-detail'
import { Suspense } from 'react'
import { cookies } from 'next/headers';
import { apiMetadata } from '@/services/api';
import { AxiosError } from 'axios';

async function fetchEvent(eventId: number): Promise<Event | null> {
  const cookieStore = await cookies();
  try {
    const res = await apiMetadata.get(`/api/events/${eventId}`, {
      headers: {
        Cookie: cookieStore.toString(),
      },
    });
    return res.data.event
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
  params: Promise<{ id: number }>
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
