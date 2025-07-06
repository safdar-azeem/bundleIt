<script setup lang="ts">
import { ref, watch } from 'vue'
import Input from './Input.vue'
import { FileNode } from '../types'
import fuzzysort from 'fuzzysort'

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
   if (!query.trim()) {
      emit('update:isSearching', false)
      return nodes
   }

   const lowercaseQuery = query.toLowerCase().trim()

   // Try regex matching first
   let regexResults: FileNode[] = []
   let isValidRegex = false
   try {
      const regex = new RegExp(query, 'i')
      regexResults = filterByRegex(nodes, regex)
      isValidRegex = true
      regexError.value = ''
   } catch (error) {
      regexError.value = 'Invalid regex pattern'
   }

   if (isValidRegex && regexResults.length > 0) {
      emit('update:isSearching', true)
      return regexResults
   }

   const fuzzyResults = performFuzzySearch(nodes, lowercaseQuery)
   emit('update:isSearching', true)
   return fuzzyResults
}

function filterByRegex(nodes: FileNode[], regex: RegExp): FileNode[] {
   return nodes.reduce((filtered: FileNode[], node) => {
      const matches = regex.test(node.name)
      let nodeToAdd: FileNode | null = null

      if (node.isDirectory) {
         const filteredChildren = node.children ? filterByRegex(node.children, regex) : []
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

function performFuzzySearch(nodes: FileNode[], query: string): FileNode[] {
   const allFiles: FileNode[] = []
   function collectFiles(node: FileNode) {
      if (node.isFile) {
         allFiles.push(node)
      }
      if (node.isDirectory && node.children) {
         node.children.forEach(collectFiles)
      }
   }
   nodes.forEach(collectFiles)

   const fuzzyResults = fuzzysort.go(query, allFiles, {
      key: 'name',
      allowTypo: true,
      threshold: -10000,
      limit: 100,
   } as any)

   const matchedNodes = fuzzyResults.map((result) => result.obj)

   const resultTree: FileNode[] = []
   const addedPaths = new Set<string>()

   function addNodeToTree(node: FileNode, parentPath: string = ''): FileNode | null {
      if (addedPaths.has(node.path)) {
         return null
      }

      if (matchedNodes.some((matched) => matched.path === node.path)) {
         addedPaths.add(node.path)
         return { ...node }
      }

      if (node.isDirectory && node.children) {
         const filteredChildren = node.children
            .map((child) => addNodeToTree(child, node.path))
            .filter((child): child is FileNode => child !== null)
         if (filteredChildren.length > 0) {
            addedPaths.add(node.path)
            return { ...node, children: filteredChildren }
         }
      }

      return null
   }

   nodes.forEach((node) => {
      const resultNode = addNodeToTree(node)
      if (resultNode) {
         resultTree.push(resultNode)
      }
   })

   return resultTree
}

function updateFilters() {
   const filtered = filterNodes(props.items, searchQuery.value)
   emit('update:filteredItems', filtered)
   emit('update:isSearching', !!searchQuery.value.trim())
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
         :error="regexError"
         :autocomplete="'off'"
         :spellcheck="false"
         :autocorrect="'off'" />
   </div>
</template>
