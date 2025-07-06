import { ref, computed, nextTick } from 'vue'
import type { Task } from '../types'
import {
   calculateNewPositions,
   applyPositionUpdates,
   type DragEvent,
   type TaskPositionUpdate,
} from '../utils/dragDrop'

export interface DragDropState {
   isDragging: boolean
   draggedTaskId: string | null
   sourceStatus: Task['status'] | null
   targetStatus: Task['status'] | null
   lastUpdate: number
}

export function useDragDrop() {
   const state = ref<DragDropState>({
      isDragging: false,
      draggedTaskId: null,
      sourceStatus: null,
      targetStatus: null,
      lastUpdate: 0,
   })

   const isDragging = computed(() => state.value.isDragging)
   const draggedTaskId = computed(() => state.value.draggedTaskId)

   const startDrag = (taskId: string, sourceStatus: Task['status']) => {
      state.value = {
         isDragging: true,
         draggedTaskId: taskId,
         sourceStatus,
         targetStatus: null,
         lastUpdate: Date.now(),
      }
   }

   const endDrag = async (
      tasks: Task[],
      dragEvent: DragEvent,
      onUpdate: (tasks: Task[], updates: TaskPositionUpdate[]) => void
   ) => {
      try {
         const updates = calculateNewPositions(tasks, dragEvent)

         if (updates.length > 0) {
            const updatedTasks = applyPositionUpdates(tasks, updates)

            await nextTick()
            onUpdate(updatedTasks, updates)
         }
      } catch (error) {
         console.error('Error in drag end handler:', error)
      } finally {
         resetDragState()
      }
   }

   const resetDragState = () => {
      state.value = {
         isDragging: false,
         draggedTaskId: null,
         sourceStatus: null,
         targetStatus: null,
         lastUpdate: Date.now(),
      }
   }

   const updateTarget = (targetStatus: Task['status']) => {
      if (state.value.isDragging) {
         state.value.targetStatus = targetStatus
         state.value.lastUpdate = Date.now()
      }
   }

   const validateDragOperation = (
      fromStatus: Task['status'],
      toStatus: Task['status'],
      taskId: string,
      tasks: Task[]
   ): boolean => {
      const task = tasks.find((t) => t.id === taskId)
      if (!task) {
         console.warn(`Task with ID ${taskId} not found`)
         return false
      }

      const validStatuses: Task['status'][] = ['todo', 'inProgress', 'completed']
      if (!validStatuses.includes(fromStatus) || !validStatuses.includes(toStatus)) {
         console.warn('Invalid status in drag operation')
         return false
      }

      return true
   }

   const bulkUpdatePositions = (
      tasks: Task[],
      updates: { taskId: string; newPosition: number; newStatus: Task['status'] }[]
   ): Task[] => {
      const updateMap = new Map(updates.map((u) => [u.taskId, u]))
      const now = Date.now()

      return tasks.map((task) => {
         const update = updateMap.get(task.id)
         if (update) {
            return {
               ...task,
               position: update.newPosition,
               status: update.newStatus,
               updatedAt: now,
            }
         }
         return task
      })
   }

   const reorderWithinColumn = (
      tasks: Task[],
      status: Task['status'],
      fromIndex: number,
      toIndex: number
   ): Task[] => {
      const columnTasks = tasks
         .filter((task) => task.status === status)
         .sort((a, b) => a.position - b.position)

      const [movedTask] = columnTasks.splice(fromIndex, 1)
      columnTasks.splice(toIndex, 0, movedTask)

      const updatedColumnTasks = columnTasks.map((task, index) => ({
         ...task,
         position: index,
         updatedAt: Date.now(),
      }))

      const otherTasks = tasks.filter((task) => task.status !== status)
      return [...otherTasks, ...updatedColumnTasks]
   }

   return {
      state: computed(() => state.value),
      isDragging,
      draggedTaskId,

      startDrag,
      endDrag,
      resetDragState,
      updateTarget,
      validateDragOperation,
      bulkUpdatePositions,
      reorderWithinColumn,
   }
}
