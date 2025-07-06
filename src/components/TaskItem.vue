<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { Task } from '../types'
import { computed, ref, watch } from 'vue'
import AutoTextarea from './AutoTextarea.vue'

const props = defineProps<{
   task: Task
   isDragging?: boolean
}>()

const emit = defineEmits<{
   update: [task: Task]
   delete: []
   clickItem: []
}>()

const isEditing = ref(false)
const editingTitle = ref('')
const editingDescription = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

const hasDescription = computed(() => {
   return props.task.description && props.task.description.trim().length > 0
})

const truncatedTitle = computed(() => {
   const title = props.task.title
   return title.length > 80 ? title.substring(0, 80) + '...' : title
})

const truncatedDescription = computed(() => {
   const desc = props.task.description
   return desc.length > 120 ? desc.substring(0, 120) + '...' : desc
})

let updateTimeout: any = null

const startEditing = async (event: Event) => {
   event.stopPropagation()
   if (props.isDragging) return
   setTimeout(() => {
      inputRef.value?.focus()
   }, 3)

   isEditing.value = true
   editingTitle.value = props.task.title
   editingDescription.value = props.task.description
}

const saveEdits = () => {
   if (updateTimeout) {
      clearTimeout(updateTimeout)
   }

   updateTimeout = setTimeout(() => {
      const updatedTask: Task = {
         ...props.task,
         title: editingTitle.value.trim() || props.task.title,
         description: editingDescription.value.trim(),
         updatedAt: Date.now(),
      }

      emit('update', updatedTask)
      isEditing.value = false
   }, 300)
}

const cancelEditing = () => {
   isEditing.value = false
   editingTitle.value = ''
   editingDescription.value = ''
}

const handleKeydown = (event: KeyboardEvent) => {
   if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      saveEdits()
   } else if (event.key === 'Escape') {
      event.preventDefault()
      cancelEditing()
   }
}

const handleDelete = (event: Event) => {
   event.stopPropagation()
   if (props.isDragging) return
   emit('delete')
}

watch(
   () => props.task,
   (newTask) => {
      if (!isEditing.value) {
         editingTitle.value = newTask.title
         editingDescription.value = newTask.description
      }
   },
   { deep: true }
)

const handleClickItem = () => {
   if (props?.isDragging || isEditing.value) return
   emit('clickItem')
}
</script>

<template>
   <div
      class="task-item group relative transition-all duration-200 ease-in-out cursor-pointer select-none border border-gray-200 rounded-[10px] p-3"
      :class="[task?.status === 'completed' ? 'border-gray-300 opacity-40' : 'bg-white ']"
      @click="handleClickItem">
      <div
         v-if="!isEditing"
         class="absolute top-3 right-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-md p-1 gap-3">
         <button @click="startEditing" title="Edit task">
            <Icon icon="lucide:edit-2" class="w-3 h-3" />
         </button>
         <button @click="handleDelete" title="Delete task">
            <Icon icon="lucide:trash-2" class="w-3 h-3" />
         </button>
      </div>

      <div class="space-y-2">
         <div v-if="!isEditing" class="flex items-center gap-3">
            <Icon
               :icon="
                  task.status === 'completed'
                     ? 'lucide:check-circle'
                     : task.status === 'inProgress'
                     ? 'lucide:clock'
                     : 'lucide:circle'
               "
               class="w-3 h-3 min-w-3 min-h-3" />
            <h6 class="font-medium leading-snug line-clamp-2 -text-fs-3" :title="task.title">
               {{ truncatedTitle }}
            </h6>
         </div>
         <div v-else>
            <AutoTextarea
               v-model="editingTitle"
               type="textarea"
               placeholder="Task title..."
               @keydown="handleKeydown"
               @blur="saveEdits"
               ref="inputRef"
               autofocus />
         </div>

         <div v-if="!isEditing && hasDescription">
            <p
               class="-text-fs-3 text-gray-600 line-clamp-2 leading-relaxed"
               :title="task.description">
               {{ truncatedDescription }}
            </p>
         </div>
      </div>
   </div>
</template>

<style scoped>
.task-item {
   will-change: transform, opacity;
   transform: translateZ(0);
}

.line-clamp-2 {
   display: -webkit-box;
   -webkit-line-clamp: 2;
   -webkit-box-orient: vertical;
   overflow: hidden;
}

.transition-colors {
   transition-property: color, background-color, border-color;
   transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
   transition-duration: 150ms;
}

.group:hover .opacity-0 {
   opacity: 1;
}

@supports not (backdrop-filter: blur(4px)) {
   .backdrop-blur-sm {
      background-color: rgba(255, 255, 255, 0.95);
   }
}
</style>
