'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function FilterToggle() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isDone = searchParams.get('filter') === 'done'

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const status = e.target.checked ? 'done' : 'active'
    router.push(`?filter=${status}`)
  }

  return (
    <div className="form-control">
      <label className="label cursor-pointer gap-3">
        <span className={`label-text font-bold ${!isDone ? 'text-primary' : 'text-base-content/50'}`}>
          Active
        </span>
        <input 
          type="checkbox" 
          className="toggle toggle-primary toggle-lg" 
          checked={isDone} 
          onChange={handleToggle}
        />
        <span className={`label-text font-bold ${isDone ? 'text-primary' : 'text-base-content/50'}`}>
          Done
        </span>
      </label>
    </div>
  )
}