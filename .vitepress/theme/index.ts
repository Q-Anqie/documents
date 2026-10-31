import DefaultTheme from 'vitepress/theme'
import './custom.css'

import HomeStats from './components/HomeStats.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HomeStats', HomeStats)
  }
}
