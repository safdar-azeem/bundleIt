<script setup lang="ts">
import { ref, watch } from 'vue'
import Input from './Input.vue'

const searchQuery = ref('')
</script>

<template>
   <div class="sticky top-0 bg-white z-10 pb-2">
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
