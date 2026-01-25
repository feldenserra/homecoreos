'use client'

import { toggleStatus, deleteTask } from '../actions/tasks'
import { useTransition } from 'react'

export default function TaskList({ tasks}: any) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex flex-col gap-3">
      {tasks.map((task: any) => (
        <div key={task.id} className="card card-side bg-base-100 shadow-sm border p-4 items-center gap-4">
          
          {/* THE CHECKBOX (Triggers Server Action via Client Event) */}
          <input 
            type="checkbox" 
            className="checkbox checkbox-primary"
            checked={task.done}
            disabled={isPending}
            onChange={() => startTransition(() => toggleStatus(task.id))}
          />

          <span className={`flex-1 font-bold ${task.done ? 'line-through opacity-50' : ''}`}>
            {task.name}
          </span>

          {/* DELETE BUTTON (Form Action) */}
          <form action={(formData) => startTransition(() => deleteTask(formData.get('id') as string))}>
            <input type="hidden" name="id" value={task.id} />
            <button className="btn btn-sm btn-ghost text-error">Delete</button>
          </form>

        </div>
      ))}
    </div>
  )
}