import { FileNode } from '../types'
import { ref, computed, watch } from 'vue'
import { useCache } from '../stores/cache'
import { join } from '@tauri-apps/api/path'
import { useHistory } from '../stores/history'
import { useSettings } from '../stores/settings'
import { downloadDir } from '@tauri-apps/api/path'
import { open, save } from '@tauri-apps/plugin-dialog'
import { getPathMatcher, PathMatcher } from '../utils/gitignore'
import { readTextFile, writeTextFile, readDir } from '@tauri-apps/plugin-fs'

const MAX_DEPTH = 6 // Maximum depth for directory traversal

export function useFileOperations() {
   const currentPath = ref<string>('')
   const items = ref<FileNode[]>([])
   const selectedPaths = ref<Set<string>>(new Set())
   const isProcessing = ref(false)
   const error = ref<string | null>(null)
   const fileLinesCounts = ref<Map<string, number>>(new Map())
   const isLoadingFolder = ref(false)
   const { setCached, getCached, clearCache } = useCache()

   const { settings } = useSettings()
   const { addToHistory, updateSelections, getSelections } = useHistory()

   async function readDirRecursively(
      dirPath: string,
      currentDepth: number = 0,
      pathMatcher?: PathMatcher
   ): Promise<FileNode[]> {
      // Check cache first
      const cachedData = getCached(dirPath)
      if (cachedData) {
         return cachedData
      }

      if (currentDepth >= MAX_DEPTH) {
         return []
      }

      try {
         const entries = await readDir(dirPath)
         const processedEntries: FileNode[] = []

         for (const entry of entries) {
            const fullPath = await join(dirPath, entry.name)

            if (pathMatcher?.shouldExclude(fullPath)) {
               continue
            }

            const node: FileNode = {
               name: entry.name,
               path: fullPath,
               isDirectory: entry.isDirectory,
               isFile: entry.isFile,
               children: undefined,
            }

            if (entry.isDirectory) {
               node.children = await readDirRecursively(fullPath, currentDepth + 1, pathMatcher)
            }

            processedEntries.push(node)
         }

         const sortedEntries = processedEntries.sort((a, b) => {
            if (a.isDirectory === b.isDirectory) {
               return a.name.localeCompare(b.name)
            }
            return a.isDirectory ? -1 : 1
         })

         setCached(dirPath, sortedEntries)
         return sortedEntries
      } catch (err) {
         console.error(`Error reading directory ${dirPath}:`, err)
         return []
      }
   }

   async function selectFolder(path?: string) {
      error.value = null
      try {
         isLoadingFolder.value = true
         let selectedPath: string | null = path || null

         if (!selectedPath) {
            const result = await open({
               directory: true,
               multiple: false,
            })

            if (result === null) {
               isLoadingFolder.value = false
               return
            }

            selectedPath = result as string
         }

         currentPath.value = selectedPath
         await loadDirectoryContents(selectedPath)
         addToHistory(selectedPath)

         const savedSelections = getSelections(selectedPath)
         selectedPaths.value = new Set(savedSelections)
      } catch (err) {
         console.error('Error selecting folder:', err)
         error.value = 'Failed to select folder'
      } finally {
         isLoadingFolder.value = false
      }
   }

   async function loadDirectoryContents(dirPath: string): Promise<void> {
      try {
         const pathMatcher = await getPathMatcher(dirPath, settings.value.excludes)

         const processedEntries = await readDirRecursively(dirPath, 0, pathMatcher)
         items.value = processedEntries
      } catch (err) {
         console.error('Error loading directory:', err)
         error.value = 'Failed to load directory contents'
         throw err
      }
   }

   async function createBundle(showPreview: boolean = false) {
      if (!selectedPaths.value.size || !currentPath.value) return null

      isProcessing.value = true
      error.value = null

      try {
         const pathParts = currentPath.value.split(/[/\\]/)
         const folderName = pathParts[pathParts.length - 1] || 'bundle'
         let bundleContent = `Listing the contents of the "${folderName}" folder:\n`

         // Add pre-text
         if (settings.value.preText) {
            bundleContent += settings.value.preText + '\n\n' + '='.repeat(60) + '\n'
         }

         // Process each selected file
         for (const filePath of selectedPaths.value) {
            try {
               const relativePath = filePath.replace(currentPath.value, '')
               const normalizedPath = relativePath.replace(/^[/\\]+/, '')

               bundleContent += '\n' + '='.repeat(60) + '\n\n'
               bundleContent += `File Path: ${normalizedPath}\n`

               const content = await readTextFile(filePath)
               bundleContent += content
            } catch (err) {
               console.error(`Error processing file ${filePath}:`, err)
            }
         }

         // Add after-text
         if (settings.value.afterText) {
            bundleContent += '\n\n' + '='.repeat(60) + '\n'
            bundleContent += settings.value.afterText
         }

         if (showPreview) {
            return {
               bundleContent,
               defaultFileName: `bundle-${folderName}.txt`,
            }
         }

         const downloadPath = await downloadDir()
         const defaultPath = await join(downloadPath, `bundle-${folderName}.txt`)

         const savePath = await save({
            defaultPath,
            filters: [
               {
                  name: 'Text Files',
                  extensions: ['txt'],
               },
            ],
         })

         if (savePath) {
            await writeTextFile(savePath, bundleContent)
            return {
               bundleContent,
               defaultFileName: `bundle-${folderName}.txt`,
            }
         }

         return null
      } catch (err) {
         error.value = 'Failed to create bundle'
         console.error('Error creating bundle:', err)
         throw err
      } finally {
         isProcessing.value = false
      }
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
      updateSelections,
      clearCache,
      selectFolder,
      createBundle,
      refreshCurrentFolder,
      loadDirectoryContents,
   }
}
