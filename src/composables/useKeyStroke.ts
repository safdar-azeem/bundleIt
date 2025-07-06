import { onMounted, onUnmounted, type Ref } from 'vue'

type KeyStrokeHandler = (event: KeyboardEvent) => void
type KeyStrokeOptions = {
   target?: Ref<HTMLElement | null> | HTMLElement | null
   preventDefault?: boolean
   stopPropagation?: boolean
   passive?: boolean
   capture?: boolean
}

interface KeyStrokeComposable {
   onKeyStroke: (
      key: string | string[],
      handler: KeyStrokeHandler,
      options?: KeyStrokeOptions
   ) => void
   offKeyStroke: (key: string | string[], handler?: KeyStrokeHandler) => void
   destroy: () => void
}

export const useKeyStroke = (): KeyStrokeComposable => {
   const listeners = new Map<
      string,
      Set<{ handler: KeyStrokeHandler; options?: KeyStrokeOptions }>
   >()

   const handleKeyDown = (event: KeyboardEvent) => {
      const key = normalizeKey(event.key)
      const keyListeners = listeners.get(key)

      if (keyListeners) {
         keyListeners.forEach(({ handler, options }) => {
            if (options?.preventDefault) event.preventDefault()
            if (options?.stopPropagation) event.stopPropagation()
            handler(event)
         })
      }
   }

   const normalizeKey = (key: string): string => {
      return key.toLowerCase()
   }

   const getTarget = (
      target?: Ref<HTMLElement | null> | HTMLElement | null
   ): HTMLElement | Document => {
      if (!target) return document
      if ('value' in target) return target.value || document
      return target || document
   }

   const onKeyStroke = (
      key: string | string[],
      handler: KeyStrokeHandler,
      options: KeyStrokeOptions = {}
   ) => {
      const keys = Array.isArray(key) ? key : [key]
      const target = getTarget(options.target)

      keys.forEach((k) => {
         const normalizedKey = normalizeKey(k)

         if (!listeners.has(normalizedKey)) {
            listeners.set(normalizedKey, new Set())
            target.addEventListener('keydown', handleKeyDown, {
               passive: options.passive ?? true,
               capture: options.capture ?? false,
            })
         }

         listeners.get(normalizedKey)!.add({ handler, options })
      })
   }

   const offKeyStroke = (key: string | string[], handler?: KeyStrokeHandler) => {
      const keys = Array.isArray(key) ? key : [key]

      keys.forEach((k) => {
         const normalizedKey = normalizeKey(k)
         const keyListeners = listeners.get(normalizedKey)

         if (keyListeners) {
            if (handler) {
               keyListeners.forEach((listener) => {
                  if (listener.handler === handler) {
                     keyListeners.delete(listener)
                  }
               })
            } else {
               keyListeners.clear()
            }

            if (keyListeners.size === 0) {
               listeners.delete(normalizedKey)
               document.removeEventListener('keydown', handleKeyDown)
            }
         }
      })
   }

   const destroy = () => {
      document.removeEventListener('keydown', handleKeyDown)
      listeners.clear()
   }

   onUnmounted(() => {
      destroy()
   })

   return {
      onKeyStroke,
      offKeyStroke,
      destroy,
   }
}
