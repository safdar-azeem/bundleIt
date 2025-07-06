<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import Button from './Button.vue'
import Input from './Input.vue'
import type { Task } from '../types'
import AutoTextarea from './AutoTextarea.vue'
import { useKeyStroke } from '../composables/useKeyStroke'

const props = defineProps<{
   task: Task
}>()

const emit = defineEmits<{
   update: [updates: Partial<Omit<Task, 'id' | 'createdAt'>>]
   delete: []
   close: []
}>()

const { onKeyStroke } = useKeyStroke()

const localTask = ref<Task>({ ...props.task })
const newTag = ref('')

const formattedCreatedAt = computed(() => {
   return new Date(localTask.value.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
   })
})

const formattedUpdatedAt = computed(() => {
   return new Date(localTask.value.updatedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
   })
})

watch(
   () => props.task,
   (newTask) => {
      localTask.value = { ...newTask }
   },
   { deep: true }
)

const saveChanges = () => {
   const { id, createdAt, updatedAt, ...updates } = localTask.value
   emit('update', updates)
}

const updateTitle = () => {
   if (localTask.value.title.trim()) {
      saveChanges()
   }
}

const updateDescription = () => {
   saveChanges()
}

const handleDelete = async () => {
   const confirmed = await confirm('Are you sure you want to delete this task?')
   if (confirmed) {
      emit('delete')
   }
}

onKeyStroke('Escape', () => {
   saveChanges()
   emit('close')
})
</script>

<template>
   <div class="w-96 bg-white border-l border-gray-200 flex flex-col h-full slide-in-right">
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
         <h4 class="font-semibold text-gray-900">Task Details</h4>
         <div class="flex items-center gap-2">
            <Button
               variant="secondary"
               icon="lucide:trash-2"
               size="sm"
               @click="handleDelete"
               title="Delete task" />
            <Button variant="secondary" icon="lucide:x" size="sm" @click="emit('close')" />
         </div>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4">
         <div>
            <AutoTextarea
               v-model="localTask.title"
               placeholder="Task title..."
               class="border px-3 py-3 rounded"
               @blur="updateTitle" />
         </div>

         <Input
            v-model="localTask.description"
            type="textarea"
            placeholder="Add a description..."
            class="h-[90%] flex-1"
            inputClass="h-[90%]  flex-1"
            :showClearButton="false"
            autofocus
            @blur="updateDescription" />
      </div>

      <div class="border-t border-gray-200 p-4 space-y-2 -text-fs-4 text-gray-500">
         <div class="flex items-center gap-2">
            <Icon icon="lucide:plus" class="w-3 h-3" />
            <span>Created: {{ formattedCreatedAt }}</span>
         </div>
         <div class="flex items-center gap-2">
            <Icon icon="lucide:edit" class="w-3 h-3" />
            <span>Updated: {{ formattedUpdatedAt }}</span>
         </div>
      </div>
   </div>
</template>

<style scoped>
.slide-in-right {
   animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
   from {
      transform: translateX(100%);
      opacity: 0;
   }
   to {
      transform: translateX(0);
      opacity: 1;
   }
}
</style>
