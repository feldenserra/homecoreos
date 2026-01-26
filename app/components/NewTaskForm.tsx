'use client'

import { useState } from 'react'
import * as taskRepo from '../actions/tasks'

export default function NewTaskForm() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!name.trim()) return
    
    setLoading(true)
    await taskRepo.create(name, 'Personal')
    setName('')
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
        <input 
            className="border p-2 w-full rounded"
            placeholder="New Task..."
            value={name}
            onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" disabled={loading} className="bg-blue-500 text-white p-2 rounded">
            {loading ? '...' : 'Add'}
        </button>
    </form>
  )
}