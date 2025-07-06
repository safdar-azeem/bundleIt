<script setup lang="ts">
import Input from './Input.vue'
import Kanban from './Kanban.vue'
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { Task } from '../types'
import { useTasks } from '../stores/tasks'
import TaskSidePanel from './TaskSidePanel.vue'

const props = defineProps<{
   show: boolean
   projectName: string
   projectPath: string | null
}>()

const emit = defineEmits<{
   'update:show': [value: boolean]
}>()

const { getProjectTasks, updateTask, setTasks, deleteTask, searchTasks } = useTasks()

const searchQuery = ref('')
const selectedTask = ref<Task | null>(null)
const showSidePanel = ref(false)

const tasks = computed(() => {
   if (!props.projectPath) return []
   return getProjectTasks(props.projectPath)
})

const filteredTasks = computed(() => {
   if (!props.projectPath) return []
   return searchQuery.value ? searchTasks(props.projectPath, searchQuery.value) : tasks.value
})

const close = () => {
   emit('update:show', false)
   selectedTask.value = null
   showSidePanel.value = false
}

const handleTaskClick = (task: Task) => {
   selectedTask.value = task
   showSidePanel.value = true
}

const handleUpdateTask = (updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
   if (!props.projectPath || !selectedTask.value) return

   updateTask(props.projectPath, selectedTask.value.id, updates)

   if (selectedTask.value) {
      selectedTask.value = { ...selectedTask.value, ...updates, updatedAt: Date.now() }
   }
}

const handleDeleteTask = async (taskId: string) => {
   if (!props.projectPath) return

   const confirmed = await confirm('Are you sure you want to delete this task?')
   if (confirmed) {
      deleteTask(props.projectPath, taskId)
      if (selectedTask.value?.id === taskId) {
         selectedTask.value = null
         showSidePanel.value = false
      }
   }
}

const closeSidePanel = () => {
   showSidePanel.value = false
   selectedTask.value = null
}
</script>

<template>
   <div v-if="show" class="fixed inset-0 w-full bg-white flex flex-col z-50">
      <!-- Header -->
      <div class="flex justify-between items-center gap-3 border-b px-6 py-4 bg-white">
         <Icon class="w-7 h-7 cursor-pointer mr-3" icon="mingcute:arrow-left-line" @click="close" />
         <div>
            <h5 class="text-fs-3 font-bold text-gray-900">Task Management</h5>
            <small class="text-gray-500 capitalize -text-fs-3">{{ projectName }}</small>
         </div>

         <div class="w-80 ml-auto">
            <Input
               v-model="searchQuery"
               placeholder="Search tasks..."
               icon="lucide:search"
               size="sm" />
         </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 flex overflow-hidden">
         <!-- Task Boards -->
         <div class="flex-1 overflow-hidden">
            <div class="h-full flex w-full gap-4 justify-center p-4">
               <Kanban
                  :boards="['todo', 'inProgress', 'completed']"
                  :data="filteredTasks || []"
                  @on-change="setTasks(props.projectPath, $event)"
                  @task-click="handleTaskClick" />
            </div>
         </div>
      </div>

      <!-- Side Panel -->
      <TaskSidePanel
         class="absolute right-0"
         v-if="showSidePanel && selectedTask"
         :task="selectedTask"
         @update="handleUpdateTask"
         @delete="() => handleDeleteTask(selectedTask!.id)"
         @close="closeSidePanel" />
   </div>
</template>
