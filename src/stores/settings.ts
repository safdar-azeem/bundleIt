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

export const defaultSettings: Settings = {
   preText: `------------------ 🛠️ Guidelines ------------------ 

Make sure to follow these guidelines for new code:

1. Always provide the complete code for any changes you've made—whether it's a single-line tweak or a full file update.

2. Clearly before every code blocks/artifacts mention the exact full file path of every file you’ve worked on. This helps me quickly locate the files and copy your code into my project without any confusion or extra effort.

3. Maintain the same code style and structure as the rest of the project. Consistency is important for readability and maintainability.

4. Follow the DRY (Don’t Repeat Yourself) and Modular Single Responsibility principl - adds value—to minimize redundancy and make future maintenance and readability easier.

5. Ensure code has no syntax or logical errors. Add comments only when truly absolutely necessary, skip them if the code is self-explanatory. Aim for clean, maintainable, and scalable solutions.

6. Ensure Code Is Optimized for Performance When Relevant use of memoization, caching, database indexing, pagination, lazy evaluation and parallelism (e.g., Promise.all()), parallelism only when necessary and applicable.

7. For large datasets or complex CRUD operations, use batching to minimize overhead and boost performance.

8. Ensure every API call includes proper error handling try/catch blocks or similar techniques.

9. Use semantic Elements, prioritize SEO and UX, and ensure accessibility on the frontend.

10. In your response only codeblocks/artifacts no other Explanation or extra texts


`,
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

   const resetAll = () => {
      settings.value.excludes = [...DEFAULT_EXCLUDES]
      localStorage.removeItem('bundleit-version')
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

      return (
         settings.value.projectSettings?.[path] || {
            preText: '',
            afterText: '',
         }
      )
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
      resetAll,
      DEFAULT_EXCLUDES,
      updateProjectSettings,
      getProjectSettings,
      defaultSettings,
   }
}
