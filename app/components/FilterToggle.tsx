'use client'

import { useRouter, useSearchParams } from 'next/navigation';

export default function FilterToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get('filter') === 'done' ? 'done' : 'active';

  return (
    <div className="flex border rounded p-1 gap-2 bg-gray-100">
      <button 
        onClick={() => router.push('?filter=active')}
        className={`flex-1 px-4 py-1 rounded ${current === 'active' ? 'bg-white shadow' : 'text-gray-500'}`}
      >
        My Tasks
      </button>
      <button 
        onClick={() => router.push('?filter=done')}
        className={`flex-1 px-4 py-1 rounded ${current === 'done' ? 'bg-white shadow' : 'text-gray-500'}`}
      >
        Archive
      </button>
    </div>
  );
}