<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '../types'
import KanbanBoard from './KanbanBoard.vue'
import { useDragDrop } from '../composables/useDragDrop'
import { groupTasksByStatus, type DragEvent } from '../utils/dragDrop'

const props = defineProps<{
   data: Task[]
   boards: Task['status'][]
}>()

const emit = defineEmits<{
   onChange: [newValue: Task[]]
   taskClick: [task: Task]
}>()

const {
   isDragging,
   draggedTaskId,
   startDrag,
   endDrag,
   validateDragOperation,
   reorderWithinColumn,
} = useDragDrop()

const groupedTasks = computed(() => {
   return groupTasksByStatus(props.data, props.boards)
})

const handleDragEnd = async (event: any) => {
   try {
      const fromStatus = event.from.getAttribute('data-status') as Task['status']
      const toStatus = event.to.getAttribute('data-status') as Task['status']
      const fromIndex = event.oldIndex
      const toIndex = event.newIndex

      const draggedTask = props.data.find((t) => t.id === draggedTaskId.value)
      if (!draggedTask) {
         console.warn('Dragged task not found')
         return
      }

      if (!validateDragOperation(fromStatus, toStatus, draggedTask.id, props.data)) {
         return
      }

      if (fromStatus === toStatus && fromIndex !== toIndex) {
         const updatedTasks = reorderWithinColumn(props.data, fromStatus, fromIndex, toIndex)
         emit('onChange', updatedTasks)
         return
      }

      const dragEvent: DragEvent = {
         from: { status: fromStatus, index: fromIndex },
         to: { status: toStatus, index: toIndex },
         item: draggedTask,
      }

      await endDrag(props.data, dragEvent, (updatedTasks, updates) => {
         emit('onChange', updatedTasks)
      })
   } catch (error) {
      console.error('Error handling drag end:', error)
   }
}

const handleDragStart = (taskId: string, status: Task['status']) => {
   startDrag(taskId, status)
}

const handleTaskChange = (updatedTask: Task, status: Task['status']) => {
   const existingTaskIndex = props.data.findIndex((task) => task.id === updatedTask.id)

   if (existingTaskIndex === -1) {
      emit('onChange', [updatedTask, ...props.data])
   } else {
      const updatedTasks = [...props.data]
      updatedTasks[existingTaskIndex] = { ...updatedTask, updatedAt: Date.now() }
      emit('onChange', updatedTasks)
   }
}

const handleTaskDelete = (taskId: string) => {
   const updatedTasks = props.data.filter((task) => task.id !== taskId)
   emit('onChange', updatedTasks)
}
</script>

<template>
   <div class="flex gap-4 h-full w-full overflow-x-auto web-scrollbar p-1">
      <KanbanBoard
         v-for="board in boards"
         :key="board"
         :data="groupedTasks[board] || []"
         :status="board"
         :title="board"
         :is-dragging="isDragging"
         :dragged-task-id="draggedTaskId"
         @drag-start="(taskId) => handleDragStart(taskId, board)"
         @drag-end="handleDragEnd"
         @task-change="handleTaskChange"
         @task-delete="handleTaskDelete"
         @task-click="emit('taskClick', $event)" />
   </div>
</template>
