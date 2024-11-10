<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps<{
   show: boolean
   message: string
   type?: 'success' | 'error' | 'info'
   duration?: number
}>()

const emit = defineEmits<{
   'update:show': [value: boolean]
}>()

const isVisible = ref(props.show)

onMounted(() => {
   if (props.duration !== 0) {
      setTimeout(() => {
         isVisible.value = false
         emit('update:show', false)
      }, props.duration || 3000)
   }
})

const variantClasses = {
   success: 'text-green-500',
   error: 'text-red-500',
   info: 'text-blue-500',
}
</script>

<template>
   <Transition
      enter-active-class="transform transition ease-out duration-300"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div
         v-if="show"
         class="fixed bottom-5 right-4 z-50 w-full max-w-[350px] bg-white rounded-lg shadow-lg border">
         <div class="flex p-3 text-fs-2 items-center">
            <div class="flex-shrink-0">
               <Icon
                  icon="lucide:circle-alert"
                  :class="variantClasses[type || 'info']"
                  class="w-5 h-5" />
            </div>
            <div class="ml-3 w-0 flex-1">
               <p class="text-gray-700">
                  {{ message }}
               </p>
            </div>
            <div class="ml-4 flex-shrink-0 flex items-center">
               <Button
                  variant="secondary"
                  icon="lucide:x"
                  size="sm"
                  @click="emit('update:show', false)" />
            </div>
         </div>
      </div>
   </Transition>
</template>
