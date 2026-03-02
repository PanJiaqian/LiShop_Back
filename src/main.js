/*
 * 模块: 应用入口
 * 作用: 创建并挂载 Vue 应用，注册路由与状态仓库，并注入全局时间格式化工具
 */
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

const formatTime = (t) => {
  if (t == null) return ''
  try {
    let s = String(t).trim()
    if (!s) return ''
    s = s.replace('T', ' ').replace(/Z$/, '')
    if (s.includes('.')) s = s.split('.')[0]
    return s
  } catch (e) {
    return String(t || '')
  }
}

const app = createApp(App)
app.config.globalProperties.$formatTime = formatTime
app.provide('formatTime', formatTime)
app.use(store).use(router).mount('#app')
