import { FileNode } from '../types'
import { ref, computed, watch } from 'vue'
import { useCache } from '../stores/cache'
import { useHistory } from '../stores/history'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { useBundleOperations } from './useBundleOperations'
import { useDirectoryOperations } from './useDirectoryOperations'

export function useFileOperations() {
   const isProcessing = ref(false)
   const items = ref<FileNode[]>([])
   const isLoadingFolder = ref(false)
   const currentPath = ref<string>('')
   const error = ref<string | null>(null)
   const selectedPaths = ref<Set<string>>(new Set())
   const { setCached, getCached, clearCache } = useCache()
   const fileLinesCounts = ref<Map<string, number>>(new Map())
   const { updateSelections, getSelections, addToHistory } = useHistory()

   const {
      loadDirectoryContents,
      selectFolder: selectFolderDir,
      isLoadingBackground,
   } = useDirectoryOperations(items, currentPath, error)

   const { createBundle: createBundleFiles } = useBundleOperations(
      selectedPaths,
      currentPath,
      isProcessing,
      error
   )

   async function selectFolder(path?: string) {
      error.value = null
      try {
         isLoadingFolder.value = true
         const result = await selectFolderDir(path)

         if (!result) {
            isLoadingFolder.value = false
            return
         }

         addToHistory(currentPath.value)

         const savedSelections = getSelections(currentPath.value)
         selectedPaths.value = new Set(savedSelections)
      } catch (err) {
         console.error('Error selecting folder:', err)
         error.value = 'Failed to select folder'
      } finally {
         isLoadingFolder.value = false
      }
   }

   async function createBundle(showPreview: boolean = false) {
      return createBundleFiles(showPreview)
   }

   async function getFileLineCount(filePath: string): Promise<number> {
      const cachedCount = getCached(filePath, 'content')
      if (cachedCount !== null) {
         return cachedCount
      }

      try {
         const content = await readTextFile(filePath)
         const count = content.split('\n').length
         setCached(filePath, count, 'content')
         return count
      } catch (err) {
         console.error('Error counting lines:', err)
         return 0
      }
   }

   const totalLines = computed(() => {
      let total = 0
      for (const count of fileLinesCounts.value.values()) {
         total += count
      }
      return total
   })

   async function refreshCurrentFolder() {
      if (currentPath.value) {
         clearCache()
         await loadDirectoryContents(currentPath.value)
      }
   }

   // Update line counts when selections change
   watch(
      selectedPaths,
      async (newPaths) => {
         const promises = Array.from(newPaths).map(async (path) => {
            if (!fileLinesCounts.value.has(path)) {
               const count = await getFileLineCount(path)
               fileLinesCounts.value.set(path, count)
            }
         })

         await Promise.all(promises)

         // Cleanup old entries
         for (const path of fileLinesCounts.value.keys()) {
            if (!newPaths.has(path)) {
               fileLinesCounts.value.delete(path)
            }
         }
      },
      { deep: true }
   )

   return {
      items,
      error,
      currentPath,
      totalLines,
      isProcessing,
      selectedPaths,
      isLoadingFolder,
      isLoadingBackground,
      updateSelections,
      clearCache,
      selectFolder,
      createBundle,
      refreshCurrentFolder,
      loadDirectoryContents,
   }
}
