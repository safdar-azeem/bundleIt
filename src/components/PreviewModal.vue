<script setup lang="ts">
import { ref, watch } from 'vue'
import Button from './Button.vue'

const props = defineProps<{
   show: boolean
   content: string
   fileName?: string
}>()

const emit = defineEmits<{
   'update:show': [value: boolean]
   save: []
}>()

const isCopyied = ref(false)

const copyToClipboard = async () => {
   try {
      await navigator.clipboard.writeText(props.content)
      isCopyied.value = true
      setTimeout(() => {
         isCopyied.value = false
      }, 1000)
   } catch (err) {
      console.error('Failed to copy text:', err)
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
         class="bg-white rounded-lg shadow-xl w-full max-w-[67%] h-[80%] flex flex-col"
         @click.stop>
         <!-- Header -->
         <div class="flex justify-between items-center border-b px-6 py-3">
            <div class="flex items-center gap-3">
               <h4 class="text-lg font-bold">Bundle Preview</h4>
               <span v-if="fileName" class="text-sm text-gray-600">{{ fileName }}</span>
            </div>
            <div class="flex items-center gap-2">
               <Button
                  variant="secondary"
                  :text="!isCopyied ? 'Copy' : 'Copied!'"
                  icon="lucide:clipboard-copy"
                  size="sm"
                  @click="copyToClipboard" />
               <Button variant="secondary" icon="lucide:x" @click="close" />
            </div>
         </div>

         <!-- Content -->
         <div class="flex-1 overflow-hidden p-6">
            <textarea
               :value="props.content"
               class="w-full h-full font-mono text-sm p-4 border rounded resize-none focus:border-primary focus:ring-1 focus:ring-primary web-scrollbar bg-gray-50"
               :placeholder="'No content to preview'"
               disabled />
         </div>
      </div>
   </div>
</template>
