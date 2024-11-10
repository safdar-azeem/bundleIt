<script setup lang="ts">
import { ref } from 'vue'
import { useSettings } from '../stores/settings'
import Button from './Button.vue'
import Input from './Input.vue'

defineProps<{
   show: boolean
}>()

const emit = defineEmits<{
   'update:show': [value: boolean]
}>()

const { settings, addExclude, removeExclude, resetExcludes, DEFAULT_EXCLUDES } = useSettings()

const newExclude = ref('')

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
      <div class="bg-white rounded-lg shadow-xl w-full max-w-[800px]" @click.stop>
         <div class="flex justify-between items-center border-b px-6 py-3">
            <h2 class="text-fs-5 font-bold">Settings</h2>
            <Button variant="secondary" icon="lucide:x" size="sm" @click="close" />
         </div>

         <div class="space-y-4 px-6 py-4">
            <Input
               v-model="settings.preText"
               type="textarea"
               label="Pre Text (Added at the beginning of the bundle)"
               placeholder="Enter text to be added at the start of the bundle..."
               :rows="3" />

            <!-- After Text -->
            <Input
               v-model="settings.afterText"
               type="textarea"
               label="After Text (Added at the end of the bundle)"
               placeholder="Enter text to be added at the end of the bundle..."
               :rows="3" />

            <!-- Excludes -->
            <div>
               <label class="block text-sm font-medium text-gray-850 mb-2">
                  Excluded Files and Folders
               </label>

               <div class="flex gap-2 mb-2">
                  <Input
                     v-model="newExclude"
                     placeholder="Add new exclude pattern..."
                     @keyup.enter="addNewExclude"
                     class="flex-1" />
                  <Button variant="primary" text="Add" @click="addNewExclude" />
               </div>

               <div class="flex flex-wrap gap-2 mt-6 -text-fs-3">
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

               <Button
                  variant="outline"
                  text="Reset to Defaults"
                  size="sm"
                  class="mt-4"
                  @click="resetExcludes" />
            </div>
         </div>
      </div>
   </div>
</template>
