import { FileNode } from '../types'
import { ref, Ref } from 'vue'
import { useCache } from '../stores/cache'
import { join } from '@tauri-apps/api/path'
import { useSettings } from '../stores/settings'
import { open } from '@tauri-apps/plugin-dialog'
import { getPathMatcher, PathMatcher } from '../utils/gitignore'
import { readDir } from '@tauri-apps/plugin-fs'

const INITIAL_DEPTH = 2
const MAX_DEPTH = 9
const PARALLEL_LIMIT = 150

export function useDirectoryOperations(
   items: Ref<FileNode[]>,
   currentPath: Ref<string>,
   error: Ref<string | null>
) {
   const isLoadingBackground = ref(false)
   const { setCached, getCached } = useCache()
   const { settings } = useSettings()

   async function processEntriesParallel(
      entries: Awaited<ReturnType<typeof readDir>>,
      dirPath: string,
      currentDepth: number,
      pathMatcher?: PathMatcher
   ): Promise<FileNode[]> {
      const chunks = Array.from(entries).reduce((acc, curr, i) => {
         const chunkIndex = i % PARALLEL_LIMIT
         if (!acc[chunkIndex]) acc[chunkIndex] = []
         acc[chunkIndex].push(curr)
         return acc
      }, [] as (typeof entries)[])

      const processedChunks = await Promise.all(
         chunks.map(async (chunk) => {
            const processedEntries = await Promise.all(
               chunk.map(async (entry) => {
                  const fullPath = await join(dirPath, entry.name)
                  if (pathMatcher?.shouldExclude(fullPath)) return null

                  const node: FileNode = {
                     name: entry.name,
                     path: fullPath,
                     isDirectory: entry.isDirectory,
                     isFile: entry.isFile,
                     children: undefined,
                  }

                  if (entry.isDirectory && currentDepth < MAX_DEPTH) {
                     if (currentDepth < INITIAL_DEPTH) {
                        node.children = await readDirRecursively(
                           fullPath,
                           currentDepth + 1,
                           pathMatcher
                        )
                     } else {
                        node.children = []
                        queueBackgroundLoad(node, fullPath, currentDepth + 1, pathMatcher)
                     }
                  }
                  return node
               })
            )
            return processedEntries.filter((entry): entry is FileNode => entry !== null)
         })
      )

      return processedChunks.flat()
   }

   const backgroundQueue = ref<Array<() => Promise<void>>>([])
   let isProcessingQueue = false

   function queueBackgroundLoad(
      node: FileNode,
      dirPath: string,
      depth: number,
      pathMatcher?: PathMatcher
   ) {
      const task = async () => {
         try {
            const children = await readDirRecursively(dirPath, depth, pathMatcher)
            node.children = children
            items.value = [...items.value]
         } catch (err) {
            console.error(`Background loading error for ${dirPath}:`, err)
         }
      }
      backgroundQueue.value.push(task)
      processBackgroundQueue()
   }

   async function processBackgroundQueue() {
      if (isProcessingQueue || backgroundQueue.value.length === 0) return
      isProcessingQueue = true
      isLoadingBackground.value = true

      while (backgroundQueue.value.length > 0) {
         const tasks = backgroundQueue.value.splice(0, PARALLEL_LIMIT)
         await Promise.all(tasks.map((task) => task()))
      }

      isProcessingQueue = false
      isLoadingBackground.value = false
   }

   async function selectFolder(path?: string): Promise<boolean> {
      let selectedPath: string | null = path || null

      if (!selectedPath) {
         const result = await open({
            directory: true,
            multiple: false,
         })

         if (result === null) {
            return false
         }

         selectedPath = result as string
      }

      currentPath.value = selectedPath
      await loadDirectoryContents(selectedPath)

      return true
   }

   async function loadDirectoryContents(dirPath: string): Promise<void> {
      try {
         const pathMatcher = await getPathMatcher(dirPath, settings.value.excludes)

         // Load initial depth (top 2 levels) first
         const initialEntries = await readDirRecursively(dirPath, 0, pathMatcher)
         items.value = initialEntries

         // Continue loading the rest of the directories in the background
         const loadRemainingEntries = async () => {
            const remainingEntries = await readDirRecursively(dirPath, 0, pathMatcher)
            items.value = remainingEntries
         }

         loadRemainingEntries()
      } catch (err) {
         console.error('Error loading directory:', err)
         error.value = 'Failed to load directory contents'
         throw err
      }
   }

   async function readDirRecursively(
      dirPath: string,
      currentDepth: number = 0,
      pathMatcher?: PathMatcher
   ): Promise<FileNode[]> {
      const cachedData = getCached(dirPath)
      if (cachedData) return cachedData

      if (currentDepth >= MAX_DEPTH) return []

      try {
         const entries = await readDir(dirPath)

         console.log('entries :>> ', entries)

         const processedEntries = await processEntriesParallel(
            entries,
            dirPath,
            currentDepth,
            pathMatcher
         )

         const sortedEntries = processedEntries.sort((a, b) => {
            if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name)
            return a.isDirectory ? -1 : 1
         })

         setCached(dirPath, sortedEntries)
         return sortedEntries
      } catch (err) {
         console.error(`Error reading directory ${dirPath}:`, err)
         return []
      }
   }

   return {
      isLoadingBackground,
      loadDirectoryContents,
      selectFolder,
      readDirRecursively,
      processEntriesParallel,
   }
}
