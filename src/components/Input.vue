<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PropType } from 'vue'
import { Icon } from '@iconify/vue'

export type InputVariant = 'solid' | 'outline'
export type InputSize = 'sm' | 'md' | 'lg'
export type InputType = 'text' | 'textarea' | 'password' | 'email' | 'number'

const props = defineProps({
   modelValue: {
      type: [String, Number],
      default: '',
   },
   variant: {
      type: String as PropType<InputVariant>,
      default: 'outline',
   },
   size: {
      type: String as PropType<InputSize>,
      default: 'md',
   },
   type: {
      type: String as PropType<InputType>,
      default: 'text',
   },
   placeholder: {
      type: String,
      default: '',
   },
   disabled: {
      type: Boolean,
      default: false,
   },
   loading: {
      type: Boolean,
      default: false,
   },
   rows: {
      type: Number,
      default: 3,
   },
   label: {
      type: String,
      default: '',
   },
   error: {
      type: String,
      default: '',
   },
   icon: {
      type: String,
      default: null,
   },
})

const emit = defineEmits<{
   'update:modelValue': [value: string | number]
   focus: [event: FocusEvent]
   blur: [event: FocusEvent]
}>()

const input = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)

const wrapperClasses = computed(() => [
   'relative',
   props.disabled && 'opacity-50 cursor-not-allowed',
])

const inputClasses = computed(() => {
   const variants = {
      solid: 'bg-gray-100 border-transparent focus:bg-white',
      outline: 'bg-white border-gray-300 focus:border-primary',
   }

   const sizes = {
      sm: 'text-sm px-3 py-1.5',
      md: 'px-4 py-2',
      lg: 'text-lg px-5 py-2.5',
   }

   const hasIcon = props.icon || props.loading
   const paddingLeft = {
      sm: hasIcon ? 'pl-8' : 'pl-3',
      md: hasIcon ? 'pl-10' : 'pl-4',
      lg: hasIcon ? 'pl-12' : 'pl-5',
   }

   return [
      'block w-full rounded-md border',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      variants[props.variant],
      sizes[props.size],
      paddingLeft[props.size],
      props.error ? 'border-danger' : '',
   ]
})

const iconClasses = computed(() => {
   const sizes = {
      sm: 'left-2.5',
      md: 'left-3',
      lg: 'left-3.5',
   }

   return [
      'absolute top-1/2 -translate-y-1/2',
      sizes[props.size],
      props.error ? 'text-danger' : 'text-gray-500',
   ]
})

const iconSize = computed(
   () =>
      ({
         sm: 16,
         md: 18,
         lg: 20,
      }[props.size])
)

function handleInput(event: Event) {
   const target = event.target as HTMLInputElement | HTMLTextAreaElement
   emit('update:modelValue', target.value)
}
</script>

<template>
   <div :class="wrapperClasses">
      <label v-if="label" class="block mb-1.5 text-sm font-medium text-gray-850">
         {{ label }}
      </label>

      <div class="relative">
         <textarea
            v-if="type === 'textarea'"
            ref="input"
            :value="modelValue"
            :rows="rows"
            :placeholder="placeholder"
            :disabled="disabled"
            :class="inputClasses"
            class="placeholder:text-gray-750"
            @input="handleInput"
            @focus="emit('focus', $event)"
            @blur="emit('blur', $event)" />

         <input
            v-else
            ref="input"
            :type="type"
            :value="modelValue"
            :placeholder="placeholder"
            :disabled="disabled"
            class="placeholder:text-gray-750"
            :class="inputClasses"
            @input="handleInput"
            @focus="emit('focus', $event)"
            @blur="emit('blur', $event)" />

         <Icon
            icon="svg-spinners:180-ring"
            v-if="loading"
            :size="iconSize"
            :class="[iconClasses, 'animate-spin']" />
         <Icon :icon="icon" v-else-if="icon" :size="iconSize" :class="iconClasses" />
      </div>

      <p v-if="error" class="mt-1.5 text-sm text-danger">
         {{ error }}
      </p>
   </div>
</template>
