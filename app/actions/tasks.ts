'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '../data/data'

export async function getAll(showCompleted: boolean) {
    const allTasks = await prisma.task.findMany({
        where: {
            done: showCompleted
        },
        orderBy: showCompleted
            ? { doneAt: 'desc' } 
            : { createdAt: 'desc' }
    })
    const totalTasks = await prisma.task.count()
    return {
        tasks: allTasks,
        total: totalTasks,
        active: allTasks.filter(t => !t.done).length,
        completed: allTasks.filter(t => t.done).length,
        work: allTasks.filter(t => t.category === 'Work' && !t.done).length
    }
}
export async function create(name: string, category: string) {
    if (!name) return
    if (!category) return

    await prisma.task.create({
        data: { name, category, done: false, doneAt: null }
    })
    revalidatePath('/')
}

export async function toggleStatus(id: string) {
    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) return
    await prisma.task.update({
        where: { id },
        data: { done: !task.done, doneAt: !task.done ? new Date() : null }
    })
    revalidatePath('/')
}

export async function deleteTask(id: string) {
    await prisma.task.delete({ where: { id } })
    revalidatePath('/')
}