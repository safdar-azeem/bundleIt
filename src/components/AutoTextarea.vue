<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
   modelValue: {
      type: String,
      required: true,
   },
   placeholder: {
      type: String,
      default: '',
   },
   autofocus: {
      type: Boolean,
      default: false,
   },
})

const emit = defineEmits(['update:modelValue'])

const localValue = ref(props.modelValue)

watch(
   () => props.modelValue,
   (newVal) => {
      if (newVal !== localValue.value) {
         localValue.value = newVal
      }
   }
)

const handleInput = () => {
   emit('update:modelValue', localValue.value)
   resize()
}

const textarea = ref(null)
const resize = () => {
   if (!textarea.value) return
   textarea.value.style.height = 'auto'
   textarea.value.style.height = textarea.value.scrollHeight + 'px'
}

onMounted(() => {
   resize()
   if (props.autofocus) {
      setTimeout(() => {
         textarea.value.focus()
      }, 3)
   }
})
watch(localValue, resize)
</script>

<template>
   <textarea
      ref="textarea"
      v-model="localValue"
      :placeholder="placeholder"
      rows="1"
      class="w-full -text-fs-1 bg-transparent resize-none flex"
      @input="handleInput" />
</template>
