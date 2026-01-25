'use client'

import { useToast } from './ToastProvider'
import * as taskRepo from '../actions/tasks'
import { TaskModel } from '@/generated/prisma/models'
import { CoreStack } from './CoreStack'
import { CoreItem } from './CoreItem'

export function TaskItem(task: TaskModel) {
    const { toast } = useToast()

    // Handler for Toggle
    async function handleToggle(e: React.ChangeEvent<HTMLInputElement>) {
        try {
            await taskRepo.toggleStatus(task.id)
            toast("Task updated", "success")
        } catch {
            toast("Failed to update", "error")
            e.target.checked = !e.target.checked
        }
    }

    async function handleDelete() {
        if (!confirm("Are you sure?")) return

        try {
            await taskRepo.deleteTask(task.id)
            toast("Task deleted", "info")
        } catch {
            toast("Could not delete", "error")
        }
    }

    return (
        <>
            <div className="card card-side bg-base-100 shadow-sm hover:shadow-md transition-all group compact">
                <div className="card-body flex-row items-center p-4 gap-4">

                    {/* Checkbox */}
                    <input
                        type="checkbox"
                        defaultChecked={task.done}
                        onChange={handleToggle}
                        className="checkbox checkbox-primary"
                    />

                    {/* Text */}
                    <CoreStack row justify="between">
                        <CoreItem>
                            <p className={`font-medium transition-all ${task.done ? 'line-through opacity-50' : ''}`}>
                                {task.name}
                            </p>
                            <CoreItem>
                                {task.done && task.doneAt && (
                                    <CoreItem className="text-xs opacity-50 mt-1">
                                        Completed on {new Date(task.doneAt).toLocaleDateString()}
                                    </CoreItem>
                                )}
                            </CoreItem>
                        </CoreItem>

                        <CoreItem>
                                <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                        </CoreItem>

                    </CoreStack>

                    {/* Delete Button */}
                    <div className="card-actions">
                        <button
                            onClick={handleDelete}
                            className="btn btn-square btn-ghost btn-sm text-error opacity-0 group-hover:opacity-100"
                        >
                            X
                        </button>
                    </div>

                </div>
            </div>
        </>
    )
}