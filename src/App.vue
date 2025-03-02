<script setup lang="ts">
import { Icon } from '@iconify/vue'
import Button from './components/Button.vue'
import Sidebar from './components/Sidebar.vue'
import FileTreeView from './components/FileTreeView.vue'
import SettingsModal from './components/SettingsModal.vue'
import { getCurrentWebview } from '@tauri-apps/api/webview'
import { useNotifications } from './composables/useNotifications'
import ToastNotification from './components/ToastNotification.vue'
import { useFileOperations } from './composables/useFileOperations'
import { computed, watch, ref, onMounted, defineAsyncComponent } from 'vue'
import WelcomeModal from './components/WelcomeModal.vue'
import Input from './components/Input.vue'

const showSettings = ref(false)
const PreviewModal = defineAsyncComponent(() => import('./components/PreviewModal.vue'))

const previewContent = ref('')
const searchQuery = ref('')
const showPreview = ref(false)
const currentBundleContent = ref('')
const showWelcome = ref(!localStorage.getItem('has-seen-welcome'))

const {
   currentPath,
   items,
   selectedPaths,
   isProcessing,
   error,
   isLoadingFolder,
   totalLines,
   clearCache,
   selectFolder,
   createBundle,
   updateSelections,
   refreshCurrentFolder,
} = useFileOperations()

const { toast, showToast } = useNotifications()

watch(
   selectedPaths,
   (newSelection) => {
      if (currentPath.value) {
         updateSelections(currentPath.value, Array.from(newSelection))
      }
   },
   { deep: true }
)

async function handleSaveBundle() {
   try {
      const bundle = await createBundle()
      if (!bundle) return

      showToast('Bundle created successfully!', 'success')
   } catch (err) {
      showToast('Failed to create bundle', 'error')
   }
}

function handleClearHistory() {
   currentPath.value = null
   selectedPaths.value.clear()
   items.value = []
}

function removeItem(path: string) {
   if (currentPath.value === path) {
      currentPath.value = null
      selectedPaths.value.clear()
      items.value = []
   }
}

async function handlePreviewBundle() {
   try {
      showPreview.value = true
      const bundle = await createBundle(true)
      if (!bundle) return

      currentBundleContent.value = bundle.bundleContent
      previewContent.value = bundle.bundleContent
   } catch (err) {
      showToast('Failed to generate preview', 'error')
   }
}

onMounted(async () => {
   await getCurrentWebview().onDragDropEvent((event) => {
      if (event.payload.type === 'drop') {
         event.payload.paths.forEach((path) => {
            selectFolder(path)
         })
      }
   })
})

function handleUnselectAll() {
   selectedPaths.value.clear()
}

const hasSelectedItems = computed(() => selectedPaths.value.size > 0)
</script>

<template>
   <div class="flex h-screen bg-body">
      <!-- Sidebar -->
      <Sidebar
         :clearCache="clearCache"
         :current-path="currentPath"
         :refreshCurrentFolder="refreshCurrentFolder"
         @open-folder="selectFolder"
         @open-settings="showSettings = true"
         @remove-item="removeItem"
         @clear-history="handleClearHistory" />

      <!-- Main Content -->
      <div class="flex-1 flex flex-col overflow-hidden">
         <!-- Header -->
         <div class="bg-body border-b">
            <div class="max-w-screen-xl mx-auto px-6 py-4">
               <div class="flex items-center justify-between">
                  <div class="flex items-center justify-between w-full space-x-4">
                     <div class="flex items-center gap-3">
                        <Button
                           variant="secondary"
                           text="Choose Folder"
                           icon="lucide:folder"
                           :disabled="isProcessing"
                           @click="() => selectFolder(null)" />
                        <Button
                           v-if="selectedPaths.size"
                           variant="secondary"
                           icon="lucide:x-circle"
                           :disabled="isProcessing"
                           @click="handleUnselectAll" />

                        <!-- Error Message -->
                        <div v-if="error" class="flex items-center text-danger">
                           <Icon icon="lucide:circle-alert" class="w-4 h-4 mr-2" />
                           {{ error }}
                        </div>
                     </div>

                     <div class="ml-auto flex items-center gap-5">
                        <!-- File counts and lines -->
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                           <span v-if="selectedPaths.size">
                              {{ selectedPaths.size }} file{{ selectedPaths.size === 1 ? '' : 's' }}
                           </span>
                           <span class="w-px h-4 bg-gray-500" v-if="selectedPaths.size"></span>
                           <span v-if="totalLines" class="flex items-center gap-1">
                              {{ totalLines.toLocaleString() }} line{{
                                 totalLines === 1 ? '' : 's'
                              }}
                           </span>
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex items-center gap-2" v-if="hasSelectedItems">
                           <Button
                              variant="secondary"
                              icon="lucide:eye"
                              :disabled="isProcessing"
                              @click="() => handlePreviewBundle()" />
                           <Button
                              variant="primary"
                              text="Create Bundle"
                              :disabled="isProcessing"
                              @click="handleSaveBundle" />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <!-- File Tree -->
         <div class="flex-1 overflow-y-auto web-scrollbar bg-body select-none">
            <div class="max-w-screen-xl mx-auto px-6 py-4">
               <div
                  v-if="isLoadingFolder"
                  class="text-center flex justify-center items-center mt-10 text-fs-5">
                  <Icon icon="svg-spinners:180-ring" class="animate-spin" />
               </div>
               <div v-else-if="items.length">
                  <div class="sticky top-0 bg-white z-10 pb-2">
                     <Input
                        v-model="searchQuery"
                        icon="lucide:search"
                        placeholder="Search files..."
                        size="sm"
                        :autocomplete="'off'"
                        :spellcheck="false"
                        :autocorrect="'off'" />
                  </div>
                  <FileTreeView :items="items" v-model:selected-paths="selectedPaths" />
               </div>
               <div v-else class="text-center py-12">
                  <div class="rounded-lg border-2 border-dashed p-12">
                     <div class="text-gray-500">
                        {{
                           currentPath ? 'This folder is empty' : 'Choose a folder to get started'
                        }}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <!-- Settings Modal -->
      <SettingsModal v-model:show="showSettings" :currentPath="currentPath" />

      <!-- Toast Notification -->
      <ToastNotification
         v-model:show="toast.show"
         :message="toast.message"
         :type="toast.type"
         :duration="3000"
         @update:show="toast.show = $event" />

      <!-- Preview Modal -->
      <PreviewModal
         v-model:show="showPreview"
         :content="previewContent"
         @save="showPreview = false" />

      <WelcomeModal v-model:show="showWelcome" />
   </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
   transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
   opacity: 0;
}
</style>
