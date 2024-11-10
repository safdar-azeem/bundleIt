import { ref, watch } from 'vue'

interface HistoryEntry {
   path: string
   name: string
   lastOpened: number
   selections: string[]
}

const MAX_HISTORY = 10

const historyStore = ref<HistoryEntry[]>(loadHistory())

function loadHistory(): HistoryEntry[] {
   const saved = localStorage.getItem('bundleit-history')
   if (saved) {
      try {
         return JSON.parse(saved)
      } catch (e) {
         console.error('Failed to parse history:', e)
      }
   }
   return []
}

watch(
   historyStore,
   (newHistory) => {
      localStorage.setItem('bundleit-history', JSON.stringify(newHistory))
   },
   { deep: true }
)

export const useHistory = () => {
   function addToHistory(path: string | null) {
      if (!path) return

      try {
         const pathParts = path.toString().split(/[/\\]/)
         const name = pathParts[pathParts.length - 1] || path

         const existingIndex = historyStore.value.findIndex((h) => h.path === path)

         if (existingIndex !== -1) {
            const entry = historyStore.value[existingIndex]
            entry.lastOpened = Date.now()

            historyStore.value = [
               entry,
               ...historyStore.value.slice(0, existingIndex),
               ...historyStore.value.slice(existingIndex + 1),
            ]
         } else {
            historyStore.value = [
               {
                  path,
                  name,
                  lastOpened: Date.now(),
                  selections: [],
               },
               ...historyStore.value,
            ].slice(0, MAX_HISTORY)
         }
      } catch (error) {
         console.error('Error adding to history:', error)
      }
   }

   function updateSelections(path: string, selections: string[]) {
      if (!path) return

      const entry = historyStore.value.find((h) => h.path === path)
      if (entry) {
         entry.selections = [...selections]
      }
   }

   function getSelections(path: string): string[] {
      if (!path) return []

      const entry = historyStore.value.find((h) => h.path === path)
      return entry?.selections || []
   }

   function removeFromHistory(path: string) {
      if (!path) return

      historyStore.value = historyStore.value.filter((h) => h.path !== path)
   }

   function clearHistory() {
      historyStore.value = []
   }

   return {
      history: historyStore,
      addToHistory,
      updateSelections,
      getSelections,
      removeFromHistory,
      clearHistory,
   }
}
