'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface PlayerLinkProps {
  id?: number | string | null;
  name: string;
  className?: string;
}

export default function PlayerLink({ id, name, className }: PlayerLinkProps) {
  const pathname = usePathname();
  const isLiveTracker = pathname?.startsWith('/live-stat-tracker');
  const safeName = name || 'Unknown';

  if (!id || isLiveTracker) {
    return <span className={className}>{safeName}</span>;
  }

  return (
    <Link 
      href={`/players/${id}`} 
      className={className} 
      prefetch={false}
      style={{ 
        color: '#1890ff', 
        textDecoration: 'underline',
        fontWeight: 500
      }}
    >
      {safeName}
    </Link>
  );
}


