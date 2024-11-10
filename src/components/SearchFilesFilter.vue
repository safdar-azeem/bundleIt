<script setup lang="ts">
import { ref, watch } from 'vue'
import Input from './Input.vue'
import { FileNode } from '../types'

const props = defineProps<{
   items: FileNode[]
}>()

const emit = defineEmits<{
   'update:filteredItems': [items: FileNode[]]
}>()

const searchQuery = ref('')

function filterNodes(nodes: FileNode[], query: string): FileNode[] {
   const lowercaseQuery = query.toLowerCase()

   return nodes.reduce((filtered: FileNode[], node) => {
      // Check if current node matches
      const matches = node.name.toLowerCase().includes(lowercaseQuery)
      let nodeToAdd: FileNode | null = null

      if (node.isDirectory) {
         const filteredChildren = node.children ? filterNodes(node.children, query) : []

         if (matches || filteredChildren.length > 0) {
            nodeToAdd = {
               ...node,
               children: filteredChildren,
            }
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

watch(
   [searchQuery, () => props.items],
   ([newQuery]) => {
      const filtered = newQuery ? filterNodes(props.items, newQuery) : props.items

      emit('update:filteredItems', filtered)
   },
   { immediate: true, deep: true }
)
</script>

<template>
   <div class="sticky top-0 bg-white z-10 pb-2">
      <Input v-model="searchQuery" icon="lucide:search" placeholder="Search files..." size="sm" />
   </div>
</template>
