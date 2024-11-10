import { ref, watch } from 'vue'

interface Settings {
   preText: string
   afterText: string
   excludes: string[]
   showHiddenFiles: boolean
}

const DEFAULT_EXCLUDES = [
   '/Pods/',
   '/vendor/bundle/',
   '.git',
   'bun.lockb',
   '.DS_Store',
   '.bundle',
   '.env',
   '.idea',
   '.next',
   '.nuxt',
   '.xcode',
   'build',
   'cache',
   'dist',
   'logs',
   'node_modules',
   'package-lock.json',
   'pnpm',
   'Thumbs.db',
   'yarn.lock',
   '.lock',
   '.yarn',
   'tmp/',
   'temp/',
   '/gen/',
   'src-tauri/target',
   '/target/',
   '.TAG',
]

const defaultSettings: Settings = {
   preText: '',
   afterText: '',
   excludes: DEFAULT_EXCLUDES,
   showHiddenFiles: false,
}

const loadSettings = (): Settings => {
   const saved = localStorage.getItem('bundleit-settings')
   if (saved) {
      try {
         return { ...defaultSettings, ...JSON.parse(saved) }
      } catch (e) {
         console.error('Failed to parse settings:', e)
      }
   }
   return defaultSettings
}

export const useSettings = () => {
   const settings = ref<Settings>(loadSettings())

   watch(
      settings,
      (newSettings) => {
         localStorage.setItem('bundleit-settings', JSON.stringify(newSettings))
      },
      { deep: true }
   )

   const addExclude = (pattern: string) => {
      if (!settings.value.excludes.includes(pattern)) {
         settings.value.excludes.push(pattern)
      }
   }

   const removeExclude = (pattern: string) => {
      settings.value.excludes = settings.value.excludes.filter((p) => p !== pattern)
   }

   const resetExcludes = () => {
      settings.value.excludes = [...DEFAULT_EXCLUDES]
   }

   return {
      settings,
      addExclude,
      removeExclude,
      resetExcludes,
      DEFAULT_EXCLUDES,
   }
}
