<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSettings } from '../stores/settings'
import Button from './Button.vue'
import Input from './Input.vue'

const props = defineProps<{
   show: boolean
   currentPath?: string | null
}>()

const emit = defineEmits<{
   'update:show': [value: boolean]
}>()

const {
   settings,
   addExclude,
   removeExclude,
   resetExcludes,
   DEFAULT_EXCLUDES,
   updateProjectSettings,
   getProjectSettings,
} = useSettings()

const newExclude = ref('')
const projectSettings = ref(
   props.currentPath ? getProjectSettings(props.currentPath) : { preText: '', afterText: '' }
)

// Watch for changes in currentPath
watch(
   () => props.currentPath,
   (newPath) => {
      if (newPath) {
         projectSettings.value = getProjectSettings(newPath)
      }
   },
   { immediate: true }
)

// Watch for changes in projectSettings and save them
watch(
   projectSettings,
   (newSettings) => {
      if (props.currentPath && newSettings) {
         updateProjectSettings(props.currentPath, newSettings)
      }
   },
   { deep: true }
)

const addNewExclude = () => {
   if (newExclude.value.trim()) {
      addExclude(newExclude.value.trim())
      newExclude.value = ''
   }
}

const close = () => {
   emit('update:show', false)
}
</script>

<template>
   <div
      v-if="show"
      class="fixed inset-0 w-full bg-[#00000077] flex items-center justify-center z-50"
      @click="close">
      <div
         class="bg-white rounded-lg shadow-xl w-full max-w-[800px] max-h-[90vh] flex flex-col"
         @click.stop>
         <div class="flex justify-between items-center border-b px-6 py-3">
            <h2 class="text-fs-5 font-bold">Bundle Settings</h2>
            <Button variant="secondary" icon="lucide:x" size="sm" @click="close" />
         </div>

         <div class="flex-1 overflow-y-auto web-scrollbar">
            <div class="space-y-6 px-6 py-4">
               <!-- Global Settings -->
               <div class="space-y-4">
                  <div class="border-b pb-2">
                     <h3 class="text-lg font-semibold text-gray-900">Global Settings</h3>
                     <p class="text-sm text-gray-600">
                        These settings will apply to all bundles across all projects
                     </p>
                  </div>

                  <div class="space-y-4">
                     <div>
                        <Input
                           v-model="settings.preText"
                           type="textarea"
                           label="Global Pre Text"
                           placeholder="Enter text to be added at the start of all bundles..."
                           :rows="3" />
                        <p class="mt-1 text-sm text-gray-500">
                           This text will appear at the very beginning of every bundle you create
                        </p>
                     </div>

                     <div>
                        <Input
                           v-model="settings.afterText"
                           type="textarea"
                           label="Global After Text"
                           placeholder="Enter text to be added at the end of all bundles..."
                           :rows="3" />
                        <p class="mt-1 text-sm text-gray-500">
                           This text will appear after project-specific content in every bundle
                        </p>
                     </div>
                  </div>
               </div>

               <!-- Project Settings -->
               <div v-if="currentPath" class="space-y-4">
                  <div class="border-b pb-2">
                     <h3 class="text-lg font-semibold text-gray-900">Project Settings</h3>
                     <p class="text-sm text-gray-600">
                        These settings will only apply to the current project
                     </p>
                  </div>

                  <div class="space-y-4">
                     <div>
                        <Input
                           v-model="projectSettings.preText"
                           type="textarea"
                           label="Project Pre Text"
                           placeholder="Enter text to be added after global pre-text..."
                           :rows="3" />
                        <p class="mt-1 text-sm text-gray-500">
                           This text will appear after the global pre-text but before the file
                           contents
                        </p>
                     </div>

                     <div>
                        <Input
                           v-model="projectSettings.afterText"
                           type="textarea"
                           label="Project After Text"
                           placeholder="Enter text to be added before global after-text..."
                           :rows="3" />
                        <p class="mt-1 text-sm text-gray-500">
                           This text will appear after the file contents but before the global
                           after-text
                        </p>
                     </div>
                  </div>
               </div>

               <!-- Excludes -->
               <div class="space-y-4">
                  <div class="border-b pb-2">
                     <h3 class="text-lg font-semibold text-gray-900">File Exclusions</h3>
                     <p class="text-sm text-gray-600">
                        Specify patterns for files and folders to exclude from bundles
                     </p>
                  </div>

                  <div class="space-y-4">
                     <div class="flex gap-2">
                        <Input
                           v-model="newExclude"
                           placeholder="Add new exclude pattern (e.g., node_modules, .env)..."
                           @keyup.enter="addNewExclude"
                           class="flex-1" />
                        <Button variant="primary" text="Add" @click="addNewExclude" />
                     </div>

                     <div class="flex flex-wrap gap-2">
                        <div
                           v-for="pattern in settings.excludes"
                           :key="pattern"
                           class="bg-gray-100 rounded-full px-3 py-1 flex items-center gap-2">
                           <span class="text-sm">{{ pattern }}</span>
                           <Button
                              v-if="!DEFAULT_EXCLUDES.includes(pattern)"
                              variant="secondary"
                              icon="lucide:x"
                              size="sm"
                              @click="removeExclude(pattern)" />
                        </div>
                     </div>

                     <div>
                        <Button
                           variant="outline"
                           text="Reset to Defaults"
                           size="sm"
                           @click="resetExcludes" />
                        <p class="mt-2 text-sm text-gray-500">
                           This will restore the default set of commonly excluded files and folders
                        </p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   </div>
</template>
