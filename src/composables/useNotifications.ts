import { ref } from 'vue'
import { Toast } from '../types'

export function useNotifications() {
   const toast = ref<Toast>({
      show: false,
      message: '',
      type: 'info',
   })

   const showClearConfirm = ref(false)

   function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
      toast.value = {
         show: true,
         message,
         type,
      }
      setTimeout(() => {
         toast.value.show = false
      }, 3000)
   }

   return {
      toast,
      showClearConfirm,
      showToast,
   }
}
