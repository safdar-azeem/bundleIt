import { Ref } from 'vue'
import { useSettings } from '../stores/settings'
import { downloadDir, join } from '@tauri-apps/api/path'
import { save } from '@tauri-apps/plugin-dialog'
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'

export function useBundleOperations(
   selectedPaths: Ref<Set<string>>,
   currentPath: Ref<string>,
   isProcessing: Ref<boolean>,
   error: Ref<string | null>
) {
   const { settings, getProjectSettings } = useSettings()

   async function createBundle(showPreview: boolean = false) {
      if (!selectedPaths.value.size || !currentPath.value) return null

      isProcessing.value = true
      error.value = null

      try {
         const pathParts = currentPath.value.split(/[/\\]/)
         const folderName = pathParts[pathParts.length - 1] || 'bundle'
         let bundleContent = `Listing the contents of the "${folderName}" folder:\n`

         // Add global pre-text
         if (settings.value.preText) {
            bundleContent += '\n' + settings.value.preText + '\n\n' + '='.repeat(55) + '\n'
         }

         // Add project pre-text
         const projectSettings = getProjectSettings(currentPath.value)
         if (projectSettings.preText) {
            bundleContent += '\n' + projectSettings.preText + '\n\n' + '='.repeat(55) + '\n'
         }

         // Process each selected file
         for (const filePath of selectedPaths.value) {
            try {
               const relativePath = filePath.replace(currentPath.value, '')
               const normalizedPath = relativePath.replace(/^[/\\]+/, '')

               const content = await readTextFile(filePath)

               // Skip empty files instead of returning
               if (!content.trim()) {
                  bundleContent += ``
                  continue
               }

               bundleContent += '\n' + '='.repeat(55) + '\n'
               bundleContent += `File Path: ${normalizedPath}\n\n`
               bundleContent += content
            } catch (err) {
               bundleContent += ``
            }
         }

         // Add global after-text
         if (settings.value.afterText) {
            bundleContent += '\n\n' + '='.repeat(55) + '\n'
            bundleContent += settings.value.afterText
         }

         // Add project after-text
         if (projectSettings.afterText) {
            bundleContent += '\n\n' + '='.repeat(55) + '\n'
            bundleContent += projectSettings.afterText
         }

         if (showPreview) {
            return {
               bundleContent,
               defaultFileName: `bundle-${folderName}.txt`,
            }
         }

         const downloadPath = await downloadDir()
         const defaultPath = await join(downloadPath, `bundle-${folderName}.txt`)

         const savePath = await save({
            defaultPath,
            filters: [
               {
                  name: 'Text Files',
                  extensions: ['txt'],
               },
            ],
         })

         if (savePath) {
            await writeTextFile(savePath, bundleContent)
            return {
               bundleContent,
               defaultFileName: `bundle-${folderName}.txt`,
            }
         }

         return null
      } catch (err) {
         error.value = 'Failed to create bundle'
         console.error('Error creating bundle:', err)
         throw err
      } finally {
         isProcessing.value = false
      }
   }

   return {
      createBundle,
   }
}
