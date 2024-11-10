import { ref } from 'vue'

interface CacheEntry {
   data: any
   timestamp: number
}

interface FileCache {
   [path: string]: CacheEntry
}

const CACHE_EXPIRY = 5 * 60 * 1000 // 5 minutes

export const useCache = () => {
   const fileCache = ref<FileCache>({})
   const contentCache = ref<FileCache>({})

   function setCached(key: string, data: any, type: 'file' | 'content' = 'file') {
      const cache = type === 'file' ? fileCache : contentCache
      cache.value[key] = {
         data,
         timestamp: Date.now(),
      }
   }

   function getCached(key: string, type: 'file' | 'content' = 'file'): any | null {
      const cache = type === 'file' ? fileCache : contentCache
      const entry = cache.value[key]

      if (!entry) return null

      // Check if cache is expired
      if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
         delete cache.value[key]
         return null
      }

      return entry.data
   }

   function clearCache(type?: 'file' | 'content') {
      if (!type || type === 'file') fileCache.value = {}
      if (!type || type === 'content') contentCache.value = {}
   }

   function removeCacheEntry(key: string, type: 'file' | 'content' = 'file') {
      const cache = type === 'file' ? fileCache : contentCache
      delete cache.value[key]
   }

   return {
      setCached,
      getCached,
      clearCache,
      removeCacheEntry,
   }
}
