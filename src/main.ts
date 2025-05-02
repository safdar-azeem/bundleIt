import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import { useVersionControl } from './stores/version'

const { checkVersion } = useVersionControl()
checkVersion()

createApp(App).mount('#app')
