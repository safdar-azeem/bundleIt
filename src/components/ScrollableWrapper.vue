<template>
   <div class="scrollable-wrapper" :class="{ scrolling: isScrolling }" @scroll="handleScroll">
      <slot />
   </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'

const isScrolling = ref(false)
let timeoutId

function handleScroll() {
   isScrolling.value = true
   clearTimeout(timeoutId)
   timeoutId = setTimeout(() => {
      isScrolling.value = false
   }, 1000)
}

onBeforeUnmount(() => {
   clearTimeout(timeoutId)
})
</script>

<style scoped>
.scrollable-wrapper {
   overflow: auto;
   scrollbar-gutter: stable;
}

.scrollable-wrapper::-webkit-scrollbar {
   width: 0;
   height: 0;
}

.scrollable-wrapper.scrolling {
   scrollbar-width: thin;
}

.scrollable-wrapper.scrolling::-webkit-scrollbar {
   width: 3px;
   height: 8px;
}

.scrollable-wrapper.scrolling::-webkit-scrollbar-thumb {
   @apply bg-gray-500;
   border-radius: 10px;
}

.scrollable-wrapper.scrolling::-webkit-scrollbar-thumb:hover {
   @apply bg-gray-500;
}

.scrollable-wrapper.scrolling::-webkit-scrollbar-track {
   background-color: transparent;
}
</style>
