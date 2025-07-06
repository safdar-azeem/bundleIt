<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import Input from './Input.vue'

interface GroupedFile {
   directory: string
   files: {
      name: string
      path: string
      lineCount?: number
   }[]
}

const props = defineProps<{
   selectedPaths: Set<string>
   fileLinesCounts: Map<string, number>
   show: boolean
   folderName: string
}>()

const emit = defineEmits<{
   'update:selectedPaths': [paths: Set<string>]
   'update:show': [value: boolean]
}>()

const searchQuery = ref('')
const regexError = ref('')

// Group files by directory
const groupedFiles = computed(() => {
   const groups: Record<string, GroupedFile> = {}

   Array.from(props.selectedPaths).forEach((path) => {
      // Skip if it's a directory (we only want to display files)
      if (!path.includes('.')) return

      const pathParts = path.split(/[/\\]/)
      const fileName = pathParts.pop() || ''
      const directory = pathParts.join('/')

      if (!groups[directory]) {
         groups[directory] = {
            directory,
            files: [],
         }
      }

      groups[directory].files.push({
         name: fileName,
         path,
         lineCount: props.fileLinesCounts.get(path),
      })
   })

   // Sort groups by directory name
   return Object.values(groups).sort((a, b) => a.directory.localeCompare(b.directory))
})

// Filtered files based on search
const filteredGroups = computed(() => {
   if (!searchQuery.value) return groupedFiles.value

   const query = searchQuery.value

   // Try regex matching first
   let regexResults: GroupedFile[] = []
   let isValidRegex = false
   try {
      const regex = new RegExp(query, 'i')
      regexResults = groupedFiles.value
         .map((group) => {
            const filteredFiles = group.files.filter((file) => regex.test(file.name))
            if (filteredFiles.length > 0) {
               return { ...group, files: filteredFiles }
            }
            return null
         })
         .filter(Boolean) as GroupedFile[]
      isValidRegex = true
      regexError.value = ''
   } catch (error) {
      regexError.value = 'Invalid regex pattern'
   }

   // If regex is valid and produced results, return them
   if (isValidRegex && regexResults.length > 0) {
      return regexResults
   }

   // Fallback to substring matching
   const lowercaseQuery = query.toLowerCase()
   return groupedFiles.value
      .map((group) => {
         const filteredFiles = group.files.filter(
            (file) =>
               file.name.toLowerCase().includes(lowercaseQuery) ||
               file.path.toLowerCase().includes(lowercaseQuery)
         )
         if (filteredFiles.length > 0) {
            return { ...group, files: filteredFiles }
         }
         return null
      })
      .filter(Boolean) as GroupedFile[]
})

const totalSelectedFiles = computed(() => {
   return Array.from(props.selectedPaths).filter((path) => path.includes('.')).length
})

// Remove a file from selection
function removeFile(path: string) {
   const newSelection = new Set(props.selectedPaths)
   newSelection.delete(path)
   emit('update:selectedPaths', newSelection)
}

// Clear all selections
function clearAllSelections() {
   emit('update:selectedPaths', new Set())
}

// Get relative path for display
function getRelativePath(path: string, fileName: string) {
   return path.substring(0, path.length - fileName.length)
}

// Close the panel
function closePanel() {
   emit('update:show', false)
}
</script>

<template>
   <div
      v-if="show"
      class="selected-files-panel bg-white border-l border-gray-200 w-[16rem] lg:w-[17.3rem] xl:w-[26%] flex flex-col h-full overflow-hidden">
      <!-- Header -->
      <div class="border-b border-gray-200 p-3 flex items-center justify-between bg-gray-50">
         <div class="font-medium flex items-center gap-2">
            <Icon icon="lucide:list-checks" class="w-4 h-4" />
            <span>Selected Files ({{ totalSelectedFiles }})</span>
         </div>
         <div class="flex gap-2">
            <button
               v-if="totalSelectedFiles > 0"
               @click="clearAllSelections"
               class="text-gray-500 hover:text-gray-700 p-1"
               title="Clear all selections">
               <Icon icon="lucide:trash-2" class="w-4 h-4" />
            </button>
            <button
               @click="closePanel"
               class="text-gray-500 hover:text-gray-700 p-1"
               title="Close panel">
               <Icon icon="lucide:x" class="w-4 h-4" />
            </button>
         </div>
      </div>

      <!-- Search bar -->
      <div class="px-2.5 py-3 -text-fs-1 border-b">
         <Input
            v-model="searchQuery"
            icon="lucide:search"
            type="text"
            size="sm"
            placeholder="Search selected files"
            :error="regexError" />
      </div>

      <!-- File list -->
      <div class="flex-1 overflow-y-auto overflow-x-hidden web-scrollbar -text-fs-1">
         <div v-if="totalSelectedFiles === 0" class="p-4 text-center text-gray-500">
            No files selected
         </div>

         <div v-else-if="filteredGroups.length === 0" class="p-4 text-center text-gray-500">
            No matching files found
         </div>

         <div v-else class="divide-y divide-gray-200">
            <div v-for="group in filteredGroups" :key="group.directory" class="py-2">
               <!-- Directory name -->
               <div class="px-3 -text-fs-1 font-medium text-gray-500 truncate">
                  {{ group.directory?.split(folderName)?.[1] || 'Root' }}
               </div>

               <!-- Files in directory -->
               <div class="space-y-0">
                  <div
                     v-for="file in group.files"
                     :key="file.path"
                     class="px-3 py-1 flex items-center justify-between group hover:bg-gray-50">
                     <div class="flex items-center overflow-hidden">
                        <Icon icon="lucide:file" class="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                        <div class="truncate">
                           <span class="text-sm">{{ file.name }}</span>
                           <div v-if="file.lineCount" class="-text-fs-4 text-gray-500">
                              {{ file.lineCount }} {{ file.lineCount === 1 ? 'line' : 'lines' }}
                           </div>
                        </div>
                     </div>

                     <button
                        @click="removeFile(file.path)"
                        class="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-500"
                        title="Remove from selection">
                        <Icon icon="lucide:x" class="w-4 h-4" />
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
   </div>
</template>

<style scoped>
.selected-files-panel {
   transition: width 0.3s ease;
}
</style>
