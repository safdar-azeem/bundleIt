import { ref, watch } from 'vue'

interface Settings {
   preText: string
   afterText: string
   excludes: string[]
   showHiddenFiles: boolean
   projectSettings: Record<
      string,
      {
         preText: string
         afterText: string
      }
   >
}

const DEFAULT_EXCLUDES = [
   'Pods',
   '.git',
   '/vendor/bundle/',
   'bun.lockb',
   '.DS_Store',
   '.log',
   '.bundle',
   '.idea',
   '.next',
   '.nuxt',
   '.local',
   '.xcode',
   'build',
   'caches',
   'cache',
   'dist',
   'dist-ssr',
   'logs',
   'node_modules',
   'package-lock.json',
   'pnpm',
   'Thumbs.db',
   'tsconfig.tsbuildinfo',
   'yarn.lock',
   '/.gradle',
   '.lock',
   '.yarn',
   'tmp',
   'release',
   'temp',
   'gen',
   'src-tauri/target',
   '/target',
   '.TAG',
   '_locales',
]

const defaultSettings: Settings = {
   preText: '',
   afterText: '',
   excludes: DEFAULT_EXCLUDES,
   showHiddenFiles: false,
   projectSettings: {},
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

   const updateProjectSettings = (
      path: string,
      projectSettings: { preText: string; afterText: string }
   ) => {
      if (!settings.value.projectSettings) {
         settings.value.projectSettings = {}
      }
      settings.value.projectSettings[path] = projectSettings
   }

   const getProjectSettings = (path: string) => {
      settings.value = loadSettings()

      return settings.value.projectSettings?.[path] || { preText: '', afterText: '' }
   }

   watch(
      () => settings.value.projectSettings,
      (newSettings) => {
         localStorage.setItem('bundleit-settings', JSON.stringify(settings.value))
      },
      { deep: true }
   )

   return {
      settings,
      addExclude,
      removeExclude,
      resetExcludes,
      DEFAULT_EXCLUDES,
      updateProjectSettings,
      getProjectSettings,
   }
}
