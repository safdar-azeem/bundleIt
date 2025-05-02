import { ref } from 'vue'
import pkg from '../../package.json'
import { defaultSettings } from './settings'

const CURRENT_VERSION = pkg.version
const VERSION_KEY = 'bundleit-version'

export const useVersionControl = () => {
   const storedVersion = ref<string | null>(localStorage.getItem(VERSION_KEY))
   const isNewVersion = ref(false)

   const checkVersion = () => {
      if (storedVersion.value !== CURRENT_VERSION) {
         isNewVersion.value = true
         handleVersionChange()
      } else {
         localStorage.setItem(VERSION_KEY, CURRENT_VERSION)
      }
   }

   const handleVersionChange = () => {
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION)
      storedVersion.value = CURRENT_VERSION

      localStorage.removeItem('has-seen-welcome')

      const saved = localStorage.getItem('bundleit-settings')
      if (saved) {
         const newSettings = {
            ...defaultSettings,
            ...JSON.parse(saved),
            preText: defaultSettings?.preText,
         }
         localStorage.setItem('bundleit-settings', JSON.stringify(newSettings))
      }
   }

   const getCurrentVersion = () => {
      return CURRENT_VERSION
   }

   return {
      storedVersion,
      isNewVersion,
      checkVersion,
      getCurrentVersion,
   }
}
