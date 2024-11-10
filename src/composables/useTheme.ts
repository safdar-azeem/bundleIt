import { onMounted, ref, watch } from 'vue'

type Theme = 'light' | 'dark'

const theme = ref<Theme>(loadTheme())

function loadTheme(): Theme {
   const savedTheme = localStorage.getItem('bundleit-theme')
   if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme
   }

   if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
   }

   return 'light'
}

function applyTheme(newTheme: Theme) {
   document.documentElement.classList.remove('light', 'dark')
   document.documentElement.classList.add(newTheme)
}

export function useTheme() {
   watch(
      theme,
      (newTheme) => {
         localStorage.setItem('bundleit-theme', newTheme)
         applyTheme(newTheme)
      },
      { immediate: true }
   )

   if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
         if (!localStorage.getItem('bundleit-theme')) {
            theme.value = e.matches ? 'dark' : 'light'
         }
      })
   }

   function toggleTheme() {
      theme.value = theme.value === 'light' ? 'dark' : 'light'
   }

   onMounted(() => {
      document.documentElement.classList.add('bg-body')
   })

   return {
      theme,
      toggleTheme,
   }
}
