<script setup lang="ts">
import { ref } from 'vue'
import Button from './Button.vue'
import { Icon } from '@iconify/vue'
import { open } from '@tauri-apps/plugin-shell'

defineProps<{
   show: boolean
}>()

const emit = defineEmits<{
   'update:show': [value: boolean]
}>()

const close = () => {
   localStorage.setItem('has-seen-welcome', 'true')
   emit('update:show', false)
}

async function openExternalLink(url) {
   try {
      await open(url)
   } catch (error) {
      console.error('Failed to open URL:', error)
   }
}
</script>

<template>
   <div
      v-if="show"
      class="fixed inset-0 w-full bg-[#00000077] flex items-center justify-center z-50"
      @click="close">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-[450px] p-6" @click.stop>
         <!-- Header with wave emoji -->
         <div class="text-center mb-3">
            <div class="text-5xl mb-2">👋</div>
            <h2 class="text-2xl font-bold text-gray-850">Welcome to BundleIt!</h2>
         </div>

         <!-- Message -->
         <div class="text-center mb-8 space-y-4">
            <p class="text-gray-700">I’m excited to have you here! Let’s stay connected.</p>
         </div>

         <!-- Social Links -->
         <div class="flex flex-col gap-3 mb-8">
            <div
               @click="openExternalLink('https://github.com/safdar-azeem')"
               class="flex cursor-pointer items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
               <Icon icon="mdi:github" class="w-6 h-6" />
               <span class="text-gray-850">Follow me on GitHub</span>
            </div>
            <div
               @click="openExternalLink('https://www.linkedin.com/in/safdar-azeem')"
               class="flex cursor-pointer items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
               <Icon icon="mdi:linkedin" class="w-6 h-6 text-[#0A66C2]" />
               <span class="text-gray-850">Connect on LinkedIn</span>
            </div>
            <div
               @click="openExternalLink('https://builto.com')"
               class="flex cursor-pointer items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
               <Icon icon="lucide:globe" class="w-6 h-6 text-blue-600" />
               <span class="text-gray-850">Visit Builto - Website & Resume Builder</span>
            </div>
         </div>

         <!-- Close Button -->
         <div class="flex justify-center">
            <Button
               variant="primary"
               text="Let's Get Started!"
               class="w-full max-w-[200px]"
               @click="close" />
         </div>
      </div>
   </div>
</template>
