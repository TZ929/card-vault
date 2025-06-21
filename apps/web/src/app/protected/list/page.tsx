'use client'

import { useAuth } from '@clerk/nextjs'
import { useRole } from '@/lib/useRole';
import Link from 'next/link';

export default function ListPage() {
  const { isSignedIn } = useAuth()
  const isSeller = useRole('SELLER');

  if (!isSignedIn) return null

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">All Listings</h1>
        {isSeller && (
          <Link href="/protected/list/new" className="btn-primary">
            Create Listing
          </Link>
        )}
      </div>
      {/* TODO: Add listing display logic here */}
      <p>Listings will be displayed here.</p>
    </div>
  );
}
