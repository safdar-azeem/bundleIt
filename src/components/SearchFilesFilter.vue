<script setup lang="ts">
import { ref, watch } from 'vue'
import Input from './Input.vue'
import { FileNode } from '../types'
import { Icon } from '@iconify/vue'

const props = defineProps<{
   items: FileNode[]
}>()

const emit = defineEmits<{
   'update:filteredItems': [items: FileNode[]]
   'update:isSearching': [value: boolean]
}>()

const searchQuery = ref('')
const regexError = ref('')

function filterNodes(nodes: FileNode[], query: string): FileNode[] {
   if (!query) return nodes

   // Try regex matching first
   let regexResults: FileNode[] = []
   let isValidRegex = false
   try {
      const regex = new RegExp(query, 'i') // Case-insensitive regex
      regexResults = nodes.reduce((filtered: FileNode[], node) => {
         const matches = regex.test(node.name)
         let nodeToAdd: FileNode | null = null

         if (node.isDirectory) {
            const filteredChildren = node.children ? filterNodes(node.children, query) : []
            if (matches || filteredChildren.length > 0) {
               nodeToAdd = { ...node, children: filteredChildren }
            }
         } else if (matches) {
            nodeToAdd = { ...node }
         }

         if (nodeToAdd) {
            filtered.push(nodeToAdd)
         }
         return filtered
      }, [])
      isValidRegex = true
      regexError.value = ''
   } catch (error) {
      regexError.value = 'Invalid regex pattern'
   }

   // If regex is valid and produced results, return them
   if (isValidRegex && regexResults.length > 0) {
      return regexResults
   }

   // Fallback to substring matching on node.name
   const lowercaseQuery = query.toLowerCase()
   return nodes.reduce((filtered: FileNode[], node) => {
      const matches = node.name.toLowerCase().includes(lowercaseQuery)
      let nodeToAdd: FileNode | null = null

      if (node.isDirectory) {
         const filteredChildren = node.children ? filterNodes(node.children, query) : []
         if (matches || filteredChildren.length > 0) {
            nodeToAdd = { ...node, children: filteredChildren }
         }
      } else if (matches) {
         nodeToAdd = { ...node }
      }

      if (nodeToAdd) {
         filtered.push(nodeToAdd)
      }
      return filtered
   }, [])
}

function updateFilters() {
   const filtered = searchQuery.value ? filterNodes(props.items, searchQuery.value) : props.items
   emit('update:filteredItems', filtered)
   emit('update:isSearching', !!searchQuery.value)
}

watch([searchQuery, () => props.items], () => updateFilters(), {
   immediate: true,
   deep: true,
})
</script>

<template>
   <div class="sticky top-0 bg-white z-10">
      <Input
         v-model="searchQuery"
         icon="lucide:search"
         placeholder="Search files..."
         size="sm"
         :autocomplete="'off'"
         :spellcheck="false"
         :autocorrect="'off'" />
   </div>
</template>
