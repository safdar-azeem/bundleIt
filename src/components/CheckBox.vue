<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps<{
   isChecked: boolean
   isIndeterminate: boolean
}>()
</script>

<template>
   <div>
      <Icon
         :icon="
            isIndeterminate
               ? 'material-symbols:indeterminate-check-box-outline'
               : isChecked
               ? 'fluent:checkbox-checked-24-filled'
               : 'fluent:checkbox-unchecked-16-regular'
         "
         :class="`${
            isChecked || isIndeterminate ? 'text-primary' : 'text-gray-500'
         } text-fs-4.5`" />
   </div>
</template>
