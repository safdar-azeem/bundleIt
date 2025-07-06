<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import { Icon } from '@iconify/vue'

export type ButtonVariant =
   | 'primary'
   | 'secondary'
   | 'danger'
   | 'outline'
   | 'outline-primary'
   | 'transparent'

export type ButtonSize = 'sm' | 'md' | 'lg'

const props = defineProps({
   variant: {
      type: String as PropType<ButtonVariant>,
      default: 'secondary',
   },
   size: {
      type: String as PropType<ButtonSize>,
      default: 'md',
   },
   disabled: {
      type: Boolean,
      default: false,
   },
   loading: {
      type: Boolean,
      default: false,
   },
   text: {
      type: String,
      default: '',
   },
   type: {
      type: String as PropType<'button' | 'submit' | 'reset'>,
      default: 'button',
   },
   icon: {
      type: String,
      default: null,
   },
   iconRight: {
      type: Object,
      default: null,
   },
   active: {
      type: Boolean,
      default: false,
   },
   iconSize: {
      type: String,
   },
})

const emit = defineEmits(['click'])

const classes = computed(() => {
   const variants = {
      primary: 'bg-primary text-primary-fg hover:bg-primary-dark',
      secondary: props.active
         ? 'bg-primary text-primary-fg'
         : 'bg-gray-200 text-gray-850 hover:bg-gray-300',
      danger: 'bg-danger text-danger-fg hover:bg-danger-dark',
      outline: 'border border-gray-400 text-gray-700 hover:bg-gray-50',
      'outline-primary': 'border-2 border-primary text-primary hover:bg-primary-light',
   }

   const sizes = {
      sm: 'text-sm px-3 py-1.5 gap-1.5',
      md: 'px-4 py-2 gap-2',
      lg: 'text-lg px-5 py-2.5 gap-2.5',
   }

   const iconSizes = {
      sm: 'p-1.5',
      md: 'p-2.5',
      lg: 'p-2.5',
   }

   return [
      'inline-flex gap-2.5 items-center justify-center rounded-md font-medium transition-colors',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      variants[props.variant],
      props.text ? sizes[props.size] : iconSizes[props?.iconSize || props.size],
   ]
})

const iconSize = computed(
   () =>
      ({
         sm: 16,
         md: 18,
         lg: 19,
      }[props?.iconSize || props.size])
)

function handleClick(event: MouseEvent) {
   if (!props.disabled && !props.loading) {
      emit('click', event)
   }
}
</script>

<template>
   <button :type="type" :class="classes" :disabled="disabled || loading" @click="handleClick">
      <Icon
         icon="svg-spinners:180-ring"
         v-if="loading"
         :style="{
            width: iconSize + 'px',
            height: iconSize + 'px',
         }"
         class="animate-spin" />
      <Icon
         :icon="icon"
         v-else-if="icon && !iconRight"
         :style="{
            width: iconSize + 'px',
            height: iconSize + 'px',
         }" />

      <span v-if="text"
         ><slot>{{ text }}</slot></span
      >

      <component :is="iconRight" v-if="iconRight && !loading" :size="iconSize" />
   </button>
</template>
