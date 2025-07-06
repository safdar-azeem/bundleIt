import type { Task } from '../types'

export interface DragEvent {
   from: {
      status: Task['status']
      index: number
   }
   to: {
      status: Task['status']
      index: number
   }
   item: Task
}

export interface TaskPositionUpdate {
   taskId: string
   newPosition: number
   newStatus: Task['status']
}

export function calculateNewPositions(tasks: Task[], dragEvent: DragEvent): TaskPositionUpdate[] {
   const updates: TaskPositionUpdate[] = []
   const { from, to, item } = dragEvent

   // If moving within the same column
   if (from.status === to.status) {
      const columnTasks = tasks
         .filter((task) => task.status === from.status)
         .sort((a, b) => a.position - b.position)

      const filteredTasks = columnTasks.filter((task) => task.id !== item.id)

      filteredTasks.splice(to.index, 0, item)

      filteredTasks.forEach((task, index) => {
         if (task.position !== index) {
            updates.push({
               taskId: task.id,
               newPosition: index,
               newStatus: from.status,
            })
         }
      })
   } else {
      const sourceTasks = tasks
         .filter((task) => task.status === from.status && task.id !== item.id)
         .sort((a, b) => a.position - b.position)

      sourceTasks.forEach((task, index) => {
         if (task.position !== index) {
            updates.push({
               taskId: task.id,
               newPosition: index,
               newStatus: from.status,
            })
         }
      })

      const destTasks = tasks
         .filter((task) => task.status === to.status)
         .sort((a, b) => a.position - b.position)

      destTasks.splice(to.index, 0, item)

      destTasks.forEach((task, index) => {
         updates.push({
            taskId: task.id,
            newPosition: index,
            newStatus: to.status,
         })
      })
   }

   return updates
}

export function applyPositionUpdates(tasks: Task[], updates: TaskPositionUpdate[]): Task[] {
   const updatedTasks = [...tasks]
   const now = Date.now()

   updates.forEach((update) => {
      const taskIndex = updatedTasks.findIndex((task) => task.id === update.taskId)
      if (taskIndex !== -1) {
         updatedTasks[taskIndex] = {
            ...updatedTasks[taskIndex],
            position: update.newPosition,
            status: update.newStatus,
            updatedAt: now,
         }
      }
   })

   return updatedTasks
}

export function groupTasksByStatus(
   tasks: Task[],
   statuses: Task['status'][]
): Record<Task['status'], Task[]> {
   const grouped: Record<Task['status'], Task[]> = {
      todo: [],
      inProgress: [],
      completed: [],
   }

   statuses.forEach((status) => {
      grouped[status] = []
   })

   tasks.forEach((task) => {
      if (grouped[task.status]) {
         grouped[task.status].push(task)
      }
   })

   Object.keys(grouped).forEach((status) => {
      grouped[status as Task['status']].sort((a, b) => a.position - b.position)
   })

   return grouped
}
