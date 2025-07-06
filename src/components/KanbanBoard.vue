<script setup lang="ts">
import { Icon } from '@iconify/vue'
import Draggable from 'vuedraggable'
import type { Task } from '../types'
import { computed, defineAsyncComponent, nextTick, onMounted, ref } from 'vue'
import ScrollableWrapper from './ScrollableWrapper.vue'

const TaskItem = defineAsyncComponent(() => import('./TaskItem.vue'))

const props = defineProps<{
   data: Task[]
   status: Task['status']
   title: string
   isDragging?: boolean
   draggedTaskId?: string | null
}>()

const emit = defineEmits<{
   taskChange: [task: Task, status: Task['status']]
   taskDelete: [taskId: string]
   dragStart: [taskId: string]
   dragEnd: [event: any]
   taskClick: [task: Task]
}>()

const isAddingTask = ref(false)
const newTaskTitle = ref('')
const addTaskInput = ref<HTMLInputElement | null>(null)
const localIsDragging = ref(false)

const taskList = computed({
   get: () => props.data,
   set: (newValue: Task[]) => {
      if (!props.isDragging && JSON.stringify(newValue) !== JSON.stringify(props.data)) {
         newValue.forEach((task, index) => {
            if (task.position !== index) {
               emit('taskChange', { ...task, position: index }, props.status)
            }
         })
      }
   },
})

const boardConfig = computed(() => {
   const configs = {
      todo: {
         icon: 'lucide:circle',
         iconClass: 'text-gray-500',
         dotClass: 'bg-gray-400',
      },
      inProgress: {
         icon: 'lucide:clock',
         iconClass: 'text-blue-500',
         dotClass: 'bg-blue-500',
      },
      completed: {
         icon: 'lucide:check-circle',
         iconClass: 'text-green-500',
         dotClass: 'bg-green-500',
      },
   }

   return configs[props.status]
})

const startAddingTask = async () => {
   isAddingTask.value = true
   await nextTick()
   addTaskInput.value?.focus()
}

const cancelAddingTask = () => {
   isAddingTask.value = false
   newTaskTitle.value = ''
}

const saveNewTask = () => {
   const title = newTaskTitle.value?.trim()
   if (!title) return

   const newTask: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description: '',
      position: 0,
      status: props.status,
      createdAt: Date.now(),
      updatedAt: Date.now(),
   }

   emit('taskChange', newTask, props.status)
   newTaskTitle.value = ''
   isAddingTask.value = false
}

const handleKeydown = (event: KeyboardEvent) => {
   if (event.key === 'Enter') {
      event.preventDefault()
      saveNewTask()
   } else if (event.key === 'Escape') {
      event.preventDefault()
      cancelAddingTask()
   }
}

const handleDragStart = (event: any) => {
   localIsDragging.value = true
   const taskElement = event.item
   const taskId = taskElement.getAttribute('data-task-id')
   if (taskId) {
      emit('dragStart', taskId)
   }
}

const handleDragEnd = (event: any) => {
   localIsDragging.value = false
   emit('dragEnd', event)
}

const dragOptions = computed(() => ({
   group: 'kanban-tasks',
   animation: 200,
   ghostClass: 'ghost-task',
   chosenClass: 'chosen-task',
   dragClass: 'drag-task',
   scroll: true,
   scrollSensitivity: 100,
   scrollSpeed: 20,
   forceFallback: false,
   fallbackOnBody: true,
   swapThreshold: 0.65,
   emptyInsertThreshold: 5,
}))

let clickTimeout: any = null

const handleTaskClick = (task: Task) => {
   if (clickTimeout) {
      clearTimeout(clickTimeout)
   }

   clickTimeout = setTimeout(() => {
      if (!localIsDragging.value && !props.isDragging) {
         emit('taskClick', task)
      }
   }, 100)
}

onMounted(() => {
   return () => {
      if (clickTimeout) {
         clearTimeout(clickTimeout)
      }
   }
})
</script>

<template>
   <div
      class="flex-1 select-none flex flex-col w-full rounded-lg transition-all bg-gray-100 duration-200">
      <div class="border-b p-4 rounded-t-lg">
         <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 flex-1">
               <div :class="[boardConfig.dotClass, 'w-2.5 h-2.5 rounded-full flex-shrink-0']"></div>
               <h6 class="font-semibold text-gray-900 truncate">{{ title }}</h6>
               <span
                  class="-text-fs-4 text-gray-800 h-9 w-9 rounded-full grid place-content-center bg-white text-center">
                  {{ data.length }}
               </span>
               <div class="flex items-center gap-2 ml-auto">
                  <button
                     @click="startAddingTask"
                     class="p-1.5 hover:bg-gray-100 rounded-md transition-colors group"
                     :disabled="isAddingTask">
                     <Icon
                        icon="lucide:plus"
                        class="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                  </button>
               </div>
            </div>
         </div>
      </div>

      <ScrollableWrapper class="flex-1 p-4 overflow-y-auto space-y-3 min-h-[200px]">
         <div v-if="isAddingTask" class="mb-3">
            <input
               ref="addTaskInput"
               v-model="newTaskTitle"
               type="text"
               placeholder="Enter task title..."
               class="w-full px-3 py-2 text-sm border border-gray-300 text-[black] rounded-[10px] focus:outline-none transition-all"
               @keydown="handleKeydown"
               @blur="cancelAddingTask"
               maxlength="200" />
         </div>

         <Draggable
            v-model="taskList"
            v-bind="dragOptions"
            :data-status="status"
            item-key="id"
            tag="div"
            class="space-y-2 min-h-[50px]"
            @start="handleDragStart"
            @end="handleDragEnd">
            <template #item="{ element: task, index }">
               <div :key="`${task.id}-${task.updatedAt}`" :data-task-id="task.id">
                  <TaskItem
                     :task="task"
                     :is-dragging="localIsDragging || isDragging"
                     @clickItem="handleTaskClick(task)"
                     @update="(updatedTask) => emit('taskChange', updatedTask, status)"
                     @delete="emit('taskDelete', task.id)" />
               </div>
            </template>
         </Draggable>
      </ScrollableWrapper>
   </div>
</template>

<style scoped>
/* Optimized drag styles */
.ghost-task {
   @apply opacity-50 border border-blue-100 rounded-lg;
}

/* Smooth transitions */
.transition-all {
   transition-property: all;
   transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Scrollbar optimization */
:deep(.sortable-ghost) {
   @apply opacity-30;
}
</style>
