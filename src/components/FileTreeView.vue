<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, ref, watch } from 'vue'
import CheckBox from './CheckBox.vue'
import { useSettings } from '../stores/settings'

interface FileNode {
   name: string
   path: string
   isDirectory: boolean
   isFile: boolean
   children?: FileNode[]
}

const props = defineProps<{
   items: FileNode[]
   selectedPaths: Set<string>
   isNested?: boolean
   isSearching?: boolean
   parentPath?: string
}>()

const emit = defineEmits<{
   'update:selectedPaths': [paths: Set<string>]
}>()

const { settings } = useSettings()
const expandedNodes = ref(new Set<string>())
const loadedPaths = ref(new Set<string>())

const sortedItems = computed(() => sortItems(props.items))

const isNodeSelected = (node: FileNode): boolean => {
   if (props.selectedPaths.has(node.path)) return true
   if (node.isDirectory && node.children) {
      return node.children.length > 0 && node.children.every((child) => isNodeSelected(child))
   }
   return false
}

const isNodePartiallySelected = (node: FileNode): boolean => {
   if (!node.isDirectory || props.selectedPaths.has(node.path)) return false
   if (node.children && node.children.length > 0) {
      const selectedChildrenCount = node.children.reduce((count, child) => {
         if (isNodeSelected(child)) return count + 1
         if (isNodePartiallySelected(child)) return count + 0.5
         return count
      }, 0)
      return selectedChildrenCount > 0 && selectedChildrenCount < node.children.length
   }
   return false
}

const shouldShowChildren = (item: FileNode): boolean => {
   if (!item.isDirectory) return false
   return expandedNodes.value.has(item.path) && Boolean(item.children?.length)
}

const shouldShowItem = (item: FileNode) => {
   const includeDotDir = ['.github', '.env']
   if (
      !settings.value.showHiddenFiles &&
      item.name.startsWith('.') &&
      !includeDotDir.includes(item.name)
   )
      return false

   if (!settings.value.excludes.includes(item.name)) {
      if (props.isSearching && item.isDirectory && (!item.children || item.children.length === 0)) {
         return false
      }
      return true
   }

   return false
}

const sortItems = (items: FileNode[]): FileNode[] => {
   return [...items].sort((a, b) => {
      if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name)
      return a.isDirectory ? -1 : 1
   })
}

const getAllPossibleFilePaths = (node: FileNode): string[] => {
   const paths: string[] = []
   const parts = node.path.split(/[/\\]/)
   for (let i = 1; i <= parts.length; i++) {
      paths.push(parts.slice(0, i).join('/'))
   }
   return paths
}

const getAllFilePaths = (node: FileNode): string[] => {
   if (node.isFile && shouldShowItem(node)) return [node.path]

   if (node.isDirectory) {
      const allPaths = [node.path]

      if (!loadedPaths.value.has(node.path)) {
         const possiblePaths = getAllPossibleFilePaths(node)
         if (possiblePaths.some((path) => props.selectedPaths.has(path))) {
            return possiblePaths
         }
      }

      if (node.children) {
         const childPaths = node.children.flatMap((child) => getAllFilePaths(child)).filter(Boolean)
         allPaths.push(...childPaths)
      }

      return allPaths
   }

   return []
}

const updateParentSelections = (path: string, isSelected: boolean) => {
   const pathParts = path.split(/[/\\]/)
   const newSelection = new Set(props.selectedPaths)

   for (let i = 1; i < pathParts.length; i++) {
      const parentPath = pathParts.slice(0, i).join('/')
      if (isSelected) {
         newSelection.add(parentPath)
      } else {
         const hasSelectedChildren = Array.from(newSelection).some(
            (selectedPath) => selectedPath.startsWith(parentPath + '/') && selectedPath !== path
         )
         if (!hasSelectedChildren) newSelection.delete(parentPath)
      }
   }

   emit('update:selectedPaths', newSelection)
}

const toggleNode = async (node: FileNode) => {
   if (!node.isDirectory) return
   if (expandedNodes.value.has(node.path)) {
      expandedNodes.value.delete(node.path)
   } else {
      expandedNodes.value.add(node.path)
      loadedPaths.value.add(node.path)
   }
}

const toggleSelection = async (node: FileNode) => {
   const newSelection = new Set(props.selectedPaths)
   const isCurrentlySelected = isNodeSelected(node)

   const processNode = async (currentNode: FileNode, selected: boolean) => {
      if (currentNode.isDirectory && currentNode.children) {
         for (const child of currentNode.children) {
            await processNode(child, selected)
         }
      }
      if (selected) {
         newSelection.add(currentNode.path)
      } else {
         newSelection.delete(currentNode.path)
      }
   }

   await processNode(node, !isCurrentlySelected)
   updateParentSelections(node.path, !isCurrentlySelected)
   emit('update:selectedPaths', newSelection)
}

const autoExpandSearchMatches = (items: FileNode[]) => {
   if (!props.isSearching) return
   items.forEach((item) => {
      if (item.isDirectory && item.children?.length) {
         expandedNodes.value.add(item.path)
         autoExpandSearchMatches(item.children)
      }
   })
}

watch(
   () => [props.isSearching, props.items],
   () => {
      if (props.isSearching) {
         autoExpandSearchMatches(props.items)
      } else {
         expandedNodes.value.clear()
         loadedPaths.value.clear()
      }
   },
   { immediate: true }
)
</script>

<template>
   <div class="space-y-4">
      <!-- File Tree -->
      <div class="file-tree">
         <template v-for="item in sortedItems" :key="item.path">
            <div v-if="shouldShowItem(item)" class="file-tree-item">
               <div
                  class="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                  @click="item?.isDirectory ? toggleNode(item) : toggleSelection(item)">
                  <button
                     v-if="item.isDirectory"
                     class="p-1 rounded hover:bg-gray-200 mr-1"
                     @click.stop="toggleNode(item)">
                     <Icon
                        :icon="
                           expandedNodes.has(item.path)
                              ? 'lucide:chevron-down'
                              : 'lucide:chevron-right'
                        "
                        class="w-4 h-4 transition-transform" />
                  </button>
                  <span v-else class="w-6"></span>

                  <CheckBox
                     :is-indeterminate="isNodePartiallySelected(item)"
                     :isChecked="isNodeSelected(item)"
                     class="mr-3"
                     @click.stop="toggleSelection(item)" />

                  <Icon
                     :icon="item.isDirectory ? 'lucide:folder' : 'lucide:file'"
                     :class="[
                        'w-4 h-4 mr-2',
                        item.isDirectory ? 'text-blue-600' : 'text-gray-600',
                     ]" />

                  <span class="text-sm text-gray-850">{{ item.name }}</span>
               </div>
               <div
                  v-if="item.isDirectory && shouldShowChildren(item)"
                  class="ml-6 mb-1 mt-1 children-container">
                  <FileTreeView
                     v-if="item.children"
                     :items="sortItems(item.children)"
                     :selected-paths="selectedPaths"
                     :is-nested="true"
                     :isSearching="isSearching"
                     :parent-path="item.path"
                     @update:selectedPaths="emit('update:selectedPaths', $event)" />
               </div>
            </div>
         </template>
      </div>
   </div>
</template>

<style scoped>
.file-tree {
   @apply divide-y;
}

.file-tree-item:last-child {
   @apply border-b-0;
}

.children-container {
   transition: height 0.2s ease-in-out;
   overflow: hidden;
}
</style>
