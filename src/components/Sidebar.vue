<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import Button from './Button.vue'
import ThemeToggle from './ThemeToggle.vue'
import { useHistory } from '../stores/history'

defineProps<{
   isProcessing: boolean
   currentPath: string | null
   clearCache: () => void
   selectFolder: (path: string | null) => void
   refreshCurrentFolder: () => Promise<void>
}>()

const emit = defineEmits<{
   'open-settings': []
   'remove-item': [path: string]
   'open-folder': [path: string]
}>()

const sortBy = ref<'name' | 'date'>('name')
const { history, removeFromHistory } = useHistory()

const sortedHistory = computed(() => {
   return [...history.value].sort((a, b) => {
      if (sortBy.value === 'name') {
         return a.name.localeCompare(b.name)
      }
      return b.lastOpened - a.lastOpened
   })
})

function handleFolderClick(path: string) {
   emit('open-folder', path)
}

function handleRemoveItem(path: string) {
   emit('remove-item', path)
   removeFromHistory(path)
}
</script>

<template>
   <div class="w-64 bg-body border-r flex flex-col h-screen select-none">
      <!-- App Logo and Name -->
      <div class="p-5 bg-white border-b -text-fs-0.5 mt-0.5 flex items-center gap-3 cursor-pointer">
         <Icon icon="lucide:layers" class="w-7 h-7.5 text-black" />
         <h1 class="font-semibold text-fs-5 text-gray-900 select-none">BundleIt</h1>
      </div>

      <!-- History Header -->
      <div class="p-4 border-b bg-white">
         <div class="flex items-center justify-between">
            <Button
               text="Choose Folder"
               class="w-full"
               variant="secondary"
               icon="lucide:folder"
               :disabled="isProcessing"
               @click="() => selectFolder(null)" />
         </div>
      </div>

      <!-- History List -->
      <div class="flex-1 overflow-y-auto">
         <div class="divide-y">
            <div
               v-for="entry in sortedHistory"
               :key="entry.path"
               class="group flex items-center gap-2 py-3 px-4 hover:bg-gray-100 cursor-pointer"
               :class="{ 'bg-primary-light': entry.path === currentPath }"
               @click="handleFolderClick(entry.path)">
               <Icon
                  icon="lucide:folder"
                  class="w-5 h-5"
                  :class="entry.path === currentPath ? 'text-blue-500' : 'text-yellow-500'" />
               <div class="flex-1 min-w-0">
                  <div class="text-sm text-gray-850 truncate capitalize">
                     {{ entry.name }}
                  </div>
               </div>
               <Button
                  variant="secondary"
                  icon="lucide:x"
                  size="sm"
                  class="opacity-0 group-hover:opacity-100"
                  @click.stop="handleRemoveItem(entry.path)" />
            </div>
         </div>
      </div>

      <!-- Footer with Settings -->
      <div class="p-3 border-t bg-white flex items-center gap-2 -text-fs-1">
         <ThemeToggle />
         <Button
            variant="secondary"
            text="Settings"
            icon="lucide:settings"
            class="w-full justify-start"
            @click="emit('open-settings')" />
      </div>
   </div>
</template>
