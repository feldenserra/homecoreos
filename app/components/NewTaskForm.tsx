'use client'

import { useToast } from './ToastProvider'
import * as taskRepo from '../actions/tasks'
import { useRef } from 'react'
import { CoreStack } from './CoreStack'

export default function NewTaskForm() {
    const { toast } = useToast()
  const ref = useRef<HTMLFormElement>(null)

  async function clientAction(formData: FormData) {
    const name = formData.get('name') as string

    if (!name) {
        toast('Task name is required', 'error')
      return
    }

    try {
      await taskRepo.create(name, 'Personal') 
      toast('Task created!', 'success')  
      ref.current?.reset()       
    } catch (e) {
      toast('Failed to save task', 'error')
    }
  }

  return (
    <>
            <CoreStack spacing={2}>
                <form ref={ref} action={clientAction}>
                    <div className="flex gap-2">
                        <textarea
                            name="name"
                            className="textarea textarea-bordered w-full resize-none"
                            placeholder="New task..."
                        />
                        <button type="submit" className="btn btn-primary">Add</button>
                    </div>
                </form>
            </CoreStack>
        </>
    )
}