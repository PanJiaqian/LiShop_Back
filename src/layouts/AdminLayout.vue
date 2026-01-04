<template>
  <div class="admin">
    <layout-header @toggle="toggleSidebar" />
    <div class="admin-body" :class="{ collapsed: sidebarCollapsed }">
      <layout-sidebar :collapsed="sidebarCollapsed" />
      <main class="admin-content">
        <router-view />
      </main>
    </div>

    <div v-if="upload.active" class="upload-progress">
      <div class="upload-progress-bar">
        <div class="upload-progress-inner" :style="{ width: upload.percent + '%' }"></div>
      </div>
      <div class="upload-progress-text">{{ upload.text }} {{ upload.percent }}%</div>
    </div>

    <!-- Global Modal Component -->
    <div v-if="modal.show" class="modal-overlay" @click="closeModal">
      <div class="modal-container" :class="modal.className" @click.stop>
        <div class="modal-header">
          <h3>{{ modal.title }}</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="modal.type === 'confirm'" class="modal-message">
            {{ modal.message }}
          </div>
          <div v-else-if="modal.type === 'detail'" class="modal-detail">
            <div 
              v-for="(item, idx) in modal.data" 
              :key="idx" 
              :class="['detail-item', item && item.type === 'image' ? 'is-image' : (item && item.type === 'video' ? 'is-video' : 'is-row')]"
            >
              <div v-if="item && item.type === 'image'" class="detail-image">
                <div v-if="item.label" class="detail-label">{{ item.label }}</div>
                <img :src="item.src || item.value" alt="preview" :class="item.large ? 'detail-image-large' : ''" @click="enlargeDetailImage(item.src || item.value)" />
              </div>
              <div v-else-if="item && item.type === 'video'" class="detail-image">
                <div v-if="item.label" class="detail-label">{{ item.label }}</div>
                <video :src="item.src || item.value" controls style="max-width: 100%; border-radius: 8px; border: 1px solid #e5e7eb;"></video>
              </div>
              <div v-else class="detail-row">
                <div class="detail-label">{{ item.label }}</div>
                <div class="detail-value">{{ item.value }}</div>
              </div>
            </div>
          </div>
          <div v-else-if="modal.type === 'form'" class="modal-form">
            <!-- Dynamic form fields based on modal.fields -->
            <div v-for="(field, key) in modal.fields" :key="key" class="form-group" v-if="!(field && field.hidden)">
              <div class="label-row">
                <label>{{ field.label }}</label>
                <span v-if="field.tooltip" class="hint-icon" :title="field.tooltip">!</span>
                <a v-if="field.link" :href="field.link" target="_blank" class="field-link">{{ field.linkText || '查看公司列表' }}</a>
              </div>
              <input 
                v-if="field.type === 'text' || field.type === 'number' || field.type === 'password' || field.type === 'email'" 
                :type="field.type" 
                v-model="field.value" 
                class="form-input"
                @focus="(e) => { if(field.onFocus) field.onFocus(e) }"
                @click="(e) => { if(field.onClick) field.onClick(e) }"
              />
              <div v-else-if="field.type === 'level-discount'" class="level-discount-group">
                <div class="ld-add-row">
                  <button class="ld-add-btn" 
                          :disabled="((Array.isArray(field.entries)?field.entries.length:0) + (field.newRows||0)) >= (field.max || 3)"
                          @click="() => {
                            const total = (Array.isArray(field.entries)?field.entries.length:0) + (field.newRows||0)
                            if (total >= (field.max || 3)) { showToast('最多添加三条等级折扣'); return }
                            field.newRows = (field.newRows || 0) + 1
                          }">＋</button>
                </div>
                <div class="ld-rows">
                  <div class="ld-row" 
                       v-for="(row, idx) in ([]).concat(Array.isArray(field.entries)?field.entries:[]).concat(new Array(field.newRows||0).fill(null))" 
                       :key="idx">
                    <input class="form-input ld-display" 
                           :readonly="true" 
                           :value="row ? (`等级${row.level}:${row.discount}`) : ''" 
                           :placeholder="row ? '' : '点击设置'" 
                           @click="() => openLevelDiscountEditor(field, idx, row)" />
                    <button class="ld-del-btn" @click="() => removeLevelDiscountRow(field, idx)">×</button>
                  </div>
                </div>
              </div>
              <div v-else-if="field.type === 'file'" class="file-input-wrapper">
                <input 
                  type="file" 
                  :multiple="field.multiple"
                  @change="(e) => { 
                    const newFiles = Array.from(e.target.files || [])
                    const existing = Array.isArray(field.files) ? field.files : []
                    const max = Number(field.maxFiles || field.max || 0)
                    if (max > 0 && (existing.length + newFiles.length) > max) {
                      const msg = `最多选择${max}个文件`
                      showToast(msg)
                      e.target.value = ''
                      if(field.onChange) field.onChange(e)
                      return
                    }
                    field.files = [...existing, ...newFiles]
                    e.target.value = ''
                    if(field.onChange) field.onChange(e) 
                  }"
                  class="form-input" 
                />
                <div v-if="Array.isArray(field.existing) && field.existing.length" class="file-thumb-list">
                  <div v-for="(u, i) in field.existing" :key="i" class="file-thumb-item">
                    <div class="thumb" @click="previewSelectedFile(u)">
                      <img v-if="isImageUrl(u)" :src="u" />
                      <video v-else-if="isVideoUrl(u)" :src="u" muted playsinline style="max-width: 100%; border-radius: 8px; border: 1px solid #e5e7eb;"></video>
                      <div v-else class="thumb-file">
                        <span class="thumb-icon">📄</span>
                      </div>
                    </div>
                    <div class="thumb-meta">
                      <span class="thumb-name">{{ basename(u) }}</span>
                      <span class="thumb-remove" @click="confirmDeleteExistingUrl(field, i)">&times;</span>
                    </div>
                  </div>
                </div>
                <div v-if="Array.isArray(field.files) && field.files.length" class="file-thumb-list">
                  <div v-for="(f, i) in field.files" :key="i" class="file-thumb-item">
                    <div class="thumb" @click="previewSelectedFile(f)">
                      <div v-if="upload.active" class="thumb-loading">
                        <div class="thumb-progress">
                          <div class="thumb-progress-inner" :style="{ width: upload.percent + '%' }"></div>
                        </div>
                      </div>
                      <img v-else-if="String(f.type || '').startsWith('image/')" :src="getFileObjectURL(f)" />
                      <div v-else class="thumb-file">
                        <span class="thumb-icon">{{ String(f.type || '').startsWith('video/') ? '🎬' : '📄' }}</span>
                      </div>
                    </div>
                    <div class="thumb-meta">
                      <span class="thumb-name">{{ f.name }}</span>
                      <span class="thumb-remove" @click="confirmDeleteFile(field, i)">&times;</span>
                    </div>
                  </div>
                </div>
              </div>
              <select v-else-if="field.type === 'select'" v-model="field.value" class="form-select" @change="(e) => { if(field.onChange) field.onChange(e) }">
                <option v-for="opt in field.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
              <div v-else-if="field.type === 'checkbox-group'" class="checkbox-group">
                <label v-for="opt in field.options" :key="opt.value" class="checkbox-item">
                  <input type="checkbox"
                         :value="opt.value"
                         :checked="Array.isArray(field.value) && field.value.includes(opt.value)"
                         @change="(e) => {
                           const v = opt.value
                           const arr = Array.isArray(field.value) ? [...field.value] : []
                           if (e.target.checked) { if (!arr.includes(v)) arr.push(v) }
                           else { const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1) }
                           field.value = arr
                         }"
                  />
                  {{ opt.label }}
                </label>
              </div>
              <div v-if="field.type === 'append-to-field'" class="token-list">
      <button v-for="opt in field.options" :key="opt.value" class="token-btn" @click="modal.fields[field.target].value += opt.value">
        {{ opt.label }}
      </button>
    </div>
    <div v-if="field.hint" class="field-hint">{{ field.hint }}</div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-sm" @click="closeModal">取消</button>
          <button class="btn-sm primary" @click="confirmModal">确定</button>
        </div>
      </div>
      <div v-if="sideEditor.visible" class="side-editor" @click.stop>
        <div class="side-editor-header">等级折扣编辑</div>
        <div class="side-editor-body">
          <div class="form-group">
            <label>等级</label>
            <select class="form-select" v-model="sideEditor.level">
              <option value="">选择等级</option>
              <option value="1">等级1</option>
              <option value="2">等级2</option>
              <option value="3">等级3</option>
            </select>
          </div>
          <div class="form-group">
            <label>折扣</label>
            <input class="form-input" placeholder="示例：0.98" v-model="sideEditor.discount" />
          </div>
        </div>
        <div class="side-editor-footer">
          <button class="btn-sm" @click="cancelLevelDiscountEditor">取消</button>
          <button class="btn-sm primary" @click="confirmLevelDiscountEditor">确定</button>
        </div>
      </div>
    </div>
    <div class="toast-container">
      <div v-for="(t, idx) in toasts" :key="idx" class="toast">{{ t }}</div>
    </div>
  </div>
</template>

<script>
import LayoutHeader from '@/components/LayoutHeader.vue'
import LayoutSidebar from '@/components/LayoutSidebar.vue'
import { reactive, provide } from 'vue'

export default {
  name: 'AdminLayout',
  components: { LayoutHeader, LayoutSidebar },
  data () {
    return {
      sidebarCollapsed: false
    }
  },
  setup() {
    const modal = reactive({
      show: false,
      type: 'confirm', // 'confirm', 'form', 'detail'
      title: '',
      message: '',
      fields: {},
      data: [],
      onConfirm: null,
      className: ''
    })

    const sideEditor = reactive({
      visible: false,
      field: null,
      index: -1,
      level: '',
      discount: ''
    })

    const upload = reactive({
      active: false,
      percent: 0,
      text: ''
    })

    const showModal = (options) => {
      modal.type = options.type || 'confirm'
      modal.title = options.title || '提示'
      modal.message = options.message || ''
      modal.fields = options.fields || {}
      modal.data = options.data || []
      modal.onConfirm = options.onConfirm
      modal.className = options.className || ''
      modal.show = true
    }

    const closeModal = () => {
      modal.show = false
    }

    const confirmModal = () => {
      if (modal.onConfirm) {
        modal.onConfirm(modal.fields)
      }
      closeModal()
    }

    provide('showModal', showModal)
    const toasts = reactive([])
    const showToast = (arg) => {
      const isObj = typeof arg === 'object' && arg !== null
      const m = String(isObj ? (arg.text || arg.message || arg.msg || '') : (arg || ''))
      if (!m) return ''
      toasts.push(m)
      const persist = isObj && !!arg.persist
      if (!persist) {
        setTimeout(() => {
          const i = toasts.indexOf(m)
          if (i >= 0) toasts.splice(i, 1)
        }, 2000)
      }
      return m
    }
    const hideToast = (m) => {
      const i = toasts.indexOf(m)
      if (i >= 0) toasts.splice(i, 1)
    }
    const confirmDialog = (options) => {
      showModal({
        type: 'confirm',
        title: (options && options.title) || '提示',
        message: (options && (options.content || options.message)) || '',
        onConfirm: options && options.onConfirm,
        className: options && options.className || ''
      })
    }
    provide('showToast', showToast)
    provide('hideToast', hideToast)
    provide('confirmDialog', confirmDialog)
    let progressTimer = null
    const duringUploadCap = 95
    const smoothTo = (target, step = 2, done) => {
      if (progressTimer) {
        clearInterval(progressTimer)
        progressTimer = null
      }
      progressTimer = setInterval(() => {
        if (upload.percent >= target) {
          clearInterval(progressTimer)
          progressTimer = null
          if (typeof done === 'function') done()
          return
        }
        const delta = Math.max(1, step)
        upload.percent = Math.min(target, upload.percent + delta)
      }, 50)
    }
    const setUploadProgress = (e, text) => {
      if (!e) return
      const loaded = e.loaded || 0
      const total = e.total || 0
      upload.active = true
      upload.text = text || '正在上传'
      const raw = total > 0 ? Math.round(loaded / total * 100) : (upload.percent + 1)
      const target = Math.min(duringUploadCap, Math.max(upload.percent, raw))
      smoothTo(target, 2)
    }
    const endUploadProgress = () => {
      upload.text = upload.text || '完成'
      smoothTo(100, 8, () => {
        setTimeout(() => {
          upload.active = false
          upload.percent = 0
          upload.text = ''
        }, 200)
      })
    }
    provide('setUploadProgress', setUploadProgress)
    provide('endUploadProgress', endUploadProgress)

    const openLevelDiscountEditor = (field, idx, row) => {
      sideEditor.visible = true
      sideEditor.field = field
      sideEditor.index = idx
      sideEditor.level = row ? String(row.level || '') : ''
      sideEditor.discount = row ? String(row.discount || '') : ''
    }
    const cancelLevelDiscountEditor = () => {
      sideEditor.visible = false
      sideEditor.field = null
      sideEditor.index = -1
      sideEditor.level = ''
      sideEditor.discount = ''
    }
    const confirmLevelDiscountEditor = () => {
      const field = sideEditor.field
      if (!field) return cancelLevelDiscountEditor()
      const sel = String(sideEditor.level || '').trim()
      const val = String(sideEditor.discount || '').trim()
      const arr = Array.isArray(field.entries) ? [...field.entries] : []
      const isEdit = sideEditor.index < arr.length
      if (!sel || !val) { showToast('请先选择等级并填写折扣'); return }
      const dup = arr.some((d, i) => i !== (isEdit ? sideEditor.index : -1) && String(d.level) === sel)
      if (dup) { showToast('不得重复设定同一等级折扣'); return }
      if (isEdit) {
        arr[sideEditor.index] = { level: sel, discount: val }
      } else {
        if (arr.length >= (field.max || 3)) { showToast('最多添加三条等级折扣'); return }
        arr.push({ level: sel, discount: val })
        field.newRows = Math.max(0, (field.newRows || 0) - 1)
      }
      field.entries = arr
      try { field.value = JSON.stringify(arr) } catch (e) { field.value = '[]' }
      field.display = arr.map(d => `等级${d.level}:${d.discount}`).join('; ')
      cancelLevelDiscountEditor()
    }
    const removeLevelDiscountRow = (field, idx) => {
      const arr = Array.isArray(field.entries) ? [...field.entries] : []
      if (idx < arr.length) {
        arr.splice(idx, 1)
        field.entries = arr
        try { field.value = JSON.stringify(arr) } catch (e) { field.value = '[]' }
        field.display = arr.map(d => `等级${d.level}:${d.discount}`).join('; ')
      } else {
        field.newRows = Math.max(0, (field.newRows || 0) - 1)
      }
      if (sideEditor.field === field && sideEditor.index === idx) cancelLevelDiscountEditor()
    }

    return {
      modal,
      closeModal,
      confirmModal,
      toasts,
      showToast,
      upload,
      sideEditor,
      openLevelDiscountEditor,
      confirmLevelDiscountEditor,
      cancelLevelDiscountEditor,
      removeLevelDiscountRow
    }
  },
  methods: {
    toggleSidebar () {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    isImageUrl (u) {
      try {
        const s = String(u || '').toLowerCase()
        return /\.(png|jpg|jpeg|gif|bmp|webp)(\?.*)?$/.test(s)
      } catch (e) { return false }
    },
    isVideoUrl (u) {
      try {
        const s = String(u || '').toLowerCase()
        return /\.(mp4|mov|webm|ogg)(\?.*)?$/.test(s)
      } catch (e) { return false }
    },
    basename (u) {
      try {
        const s = String(u || '')
        const parts = s.split('?')[0].split('/')
        return parts[parts.length - 1] || s
      } catch (e) { return '文件' }
    },
    getFileObjectURL (f) {
      try {
        const URLRef = (typeof window !== 'undefined' && (window.URL || window.webkitURL)) || null
        if (!URLRef || typeof URLRef.createObjectURL !== 'function') return ''
        if (f && typeof f === 'object') {
          if (f._previewUrl && typeof f._previewUrl === 'string') return f._previewUrl
          const u = URLRef.createObjectURL(f)
          try { f._previewUrl = u } catch (e) {}
          return u
        }
        return ''
      } catch (e) {
        return ''
      }
    },
    confirmDeleteFile (field, i) {
      const t = this
      this.modal.type = 'confirm'
      this.modal.title = '删除文件'
      this.modal.message = '确认删除该文件？'
      this.modal.onConfirm = function () {
        if (Array.isArray(field.files)) {
          const removed = field.files.splice(i, 1)[0]
          const URLRef = (typeof window !== 'undefined' && (window.URL || window.webkitURL)) || null
          if (removed && removed._previewUrl && URLRef && typeof URLRef.revokeObjectURL === 'function') {
            try { URLRef.revokeObjectURL(removed._previewUrl) } catch (e) {}
          }
        }
      }
      this.modal.show = true
    },
    previewSelectedFile (f) {
      let src = ''
      let isImg = false
      let isVideo = false
      try {
        if (f && typeof f === 'object' && (f instanceof Blob)) {
          isImg = String(f.type || '').startsWith('image/')
          isVideo = String(f.type || '').startsWith('video/')
          src = this.getFileObjectURL(f)
        } else if (typeof f === 'string') {
          src = f
          isImg = true
        }
      } catch (e) {
        src = ''
      }
      if (!src) return
      const item = isImg ? { type: 'image', src, large: true } : (isVideo ? { type: 'video', src } : { type: '', value: (f && f.name) || '' })
      const backup = {
        type: this.modal.type,
        title: this.modal.title,
        message: this.modal.message,
        fields: this.modal.fields,
        data: this.modal.data,
        onConfirm: this.modal.onConfirm,
        className: this.modal.className
      }
      this.modal.type = 'detail'
      this.modal.title = '文件预览'
      this.modal.data = [item]
      this.modal.onConfirm = () => {
        setTimeout(() => {
          this.modal.type = backup.type
          this.modal.title = backup.title
          this.modal.message = backup.message
          this.modal.fields = backup.fields
          this.modal.data = backup.data
          this.modal.onConfirm = backup.onConfirm
          this.modal.className = backup.className
          this.modal.show = true
        }, 0)
        return false
      }
      this.modal.show = true
    },
    confirmDeleteExistingUrl (field, i) {
      const t = this
      this.modal.type = 'confirm'
      this.modal.title = '删除文件'
      this.modal.message = '确认删除该文件？'
      this.modal.onConfirm = function () {
        if (Array.isArray(field.existing)) {
          field.existing.splice(i, 1)
        }
      }
      this.modal.show = true
    },
    enlargeDetailImage (url) {
      if (!url) return
      const backup = {
        type: this.modal.type,
        title: this.modal.title,
        message: this.modal.message,
        fields: this.modal.fields,
        data: this.modal.data,
        onConfirm: this.modal.onConfirm,
        className: this.modal.className
      }
      this.modal.type = 'detail'
      this.modal.title = '图片预览'
      this.modal.data = [{ type: 'image', value: url, large: true }]
      this.modal.onConfirm = () => {
        setTimeout(() => {
          this.modal.type = backup.type
          this.modal.title = backup.title
          this.modal.message = backup.message
          this.modal.fields = backup.fields
          this.modal.data = backup.data
          this.modal.onConfirm = backup.onConfirm
          this.modal.className = backup.className
          this.modal.show = true
        }, 0)
        return false
      }
      this.modal.show = true
    }
  }
}
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --primary-color: #2563eb; /* Blue-600 */
  --primary-hover: #1d4ed8; /* Blue-700 */
  --bg-color: #f3f4f6;
  --text-color: #111827;
  --sidebar-bg: #1e293b;
  --sidebar-text: #94a3b8;
}

body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.admin {
  min-height: 100vh;
  background: var(--bg-color);
  color: var(--text-color);
}

.admin-body {
  display: flex;
  height: calc(100vh - 64px);
  transition: all 0.3s ease;
}

.admin-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background-color: var(--bg-color);
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
}

.card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  padding: 24px;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid rgba(229, 231, 235, 0.5);

  &:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);
  }
}

.kpi {
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  .kpi-label {
    font-size: 14px;
    color: #6b7280;
    font-weight: 500;
  }
  
  .kpi-value {
    font-size: 28px;
    font-weight: 700;
    color: #111827;
  }

  .kpi-trend {
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
    
    &.up { color: #10b981; }
    &.down { color: #ef4444; }
  }
}

@media (max-width: 992px) {
  .admin-body {
    height: auto;
    flex-direction: column;
  }
  .admin-content {
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

@media (max-width: 576px) {
  .grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Global Utility Classes */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 12px;
  
  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #111827;
  }
}

/* Form Inputs */
.form-input, .form-select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
  box-sizing: border-box;
  background-color: #fff;
  
  &:hover {
    border-color: #cbd5e1;
  }
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
}

.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  
  input {
    width: 200px;
  }
  
  select {
    width: auto;
    min-width: 120px;
  }
}

/* Buttons */
.btn-sm, .btn-lg, .btn-link {
  border: 1px solid transparent;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  outline: none;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 14px;
  border: 1px solid #e2e8f0;
  
  &:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &.active {
    background: var(--primary-color);
    color: #fff;
    border-color: var(--primary-color);
  }
  
  &.primary {
    background: var(--primary-color);
    color: #fff;
    border-color: var(--primary-color);
    box-shadow: 0 1px 2px rgba(37, 99, 235, 0.1);
    
    &:hover { 
      background: var(--primary-hover);
      border-color: var(--primary-hover);
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1);
    }
    
    &:active {
      background: var(--primary-hover);
      box-shadow: none;
    }
  }
  
  &.secondary {
    background: #f1f5f9;
    color: #475569;
    border-color: transparent;
    &:hover { 
      background: #e2e8f0;
      color: #1e293b;
    }
  }
}

.btn-lg {
  padding: 10px 24px;
  font-size: 14px;
  
  &.primary {
    background: var(--primary-color);
    color: #fff;
    border-color: var(--primary-color);
    &:hover { background: var(--primary-hover); }
  }
}

.btn-link {
  border: none;
  background: transparent;
  color: var(--primary-color);
  padding: 4px 8px;
  font-size: 13px;
  
  &:hover {
    text-decoration: underline;
    background: transparent;
  }
  
  &.danger {
    color: #ef4444;
  }
  
  &.success {
    color: #10b981;
  }
}

.actions {
  display: flex;
  gap: 8px;
}

/* Data Table */
.data-table {
  width: 100%;
  border-collapse: collapse;
  
  th {
    text-align: left;
    padding: 12px 16px;
    color: #6b7280;
    font-size: 12px;
    font-weight: 600;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }
  
  td {
    padding: 16px;
    font-size: 14px;
    color: #1f2937;
    border-bottom: 1px solid #f3f4f6;
  }
  
  tr:last-child td {
    border-bottom: none;
  }
  
  tr:hover td {
    background-color: #f9fafb;
  }
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
  
  .page-info {
    font-size: 13px;
    color: #6b7280;
  }
  
  .page-btns {
    display: flex;
    gap: 8px;
  }
}

.badge, .status-tag {
  padding: 2px 10px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
  
  &.success { background: #dcfce7; color: #166534; }
  &.warning { background: #fef9c3; color: #854d0e; }
  &.info { background: #dbeafe; color: #1e40af; }
  &.danger { background: #fee2e2; color: #991b1b; }
  &.gray { background: #f3f4f6; color: #4b5563; }
}

.avatar-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e0e7ff;
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.view-all {
  font-size: 14px;
  color: var(--primary-color);
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: modalFadeIn 0.2s ease-out;
  display: flex;
  flex-direction: column;
  max-height: 85vh;
}

@keyframes modalFadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  
  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: #9ca3af;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    
    &:hover {
      color: #4b5563;
    }
  }
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  
  .modal-message {
    color: #4b5563;
    font-size: 15px;
    line-height: 1.5;
  }

  .modal-detail {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .detail-row {
    display: flex;
    border-bottom: 1px solid #f3f4f6;
    padding-bottom: 8px;
    
    &:last-child {
      border-bottom: none;
    }
  }

  .detail-label {
    width: 100px;
    color: #6b7280;
    font-weight: 500;
    flex-shrink: 0;
  }

  .detail-value {
    color: #111827;
    flex: 1;
    word-break: break-all;
  }
  .detail-image {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
  }
  .detail-image img {
    width: 64px;
    height: 64px;
    object-fit: cover;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
  }
  .modal-detail {
    display: block;
  }
  .modal-detail .detail-item.is-image {
    display: inline-block;
    margin: 4px;
  }
  .modal-detail .detail-image .detail-label {
    font-size: 12px;
    color: #6b7280;
  }
  .detail-image img.detail-image-large {
    width: 100%;
    height: auto;
    max-height: 80vh;
    display: block;
    border-radius: 8px;
  }
.upload-progress {
    margin-bottom: 16px;
    
    label {
      display: block;
      margin-bottom: 6px;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }
    .field-hint {
      margin-top: 4px;
      font-size: 12px;
      color: #f5222d;
    }
  }
  .checkbox-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 12px;
  }
  .checkbox-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #374151;
  }
}

.modal-footer {
  padding: 16px 24px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  border-radius: 0 0 12px 12px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
}
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1100;
}
.toast {
  background: #111827;
  color: #fff;
  padding: 8px 12px;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
  font-size: 13px;
}

.file-list {
  margin-top: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px;
  max-height: 150px;
  overflow-y: auto;
}
.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background: #f9fafb;
  margin-bottom: 4px;
  border-radius: 4px;
  font-size: 13px;
}
.file-remove {
  cursor: pointer;
  color: #ef4444;
  font-weight: bold;
  margin-left: 8px;
}
.file-thumb-list {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  margin-top: 8px;
}
.file-thumb-item {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}
.file-thumb-item .thumb {
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.file-thumb-item .thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.file-thumb-item .thumb-file {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}
.file-thumb-item .thumb-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 6px 8px;
  font-size: 12px;
}
.file-thumb-item .thumb-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.file-thumb-item .thumb-remove {
  cursor: pointer;
  color: #ef4444;
  font-weight: bold;
}
.label-row { display: flex; align-items: center; gap: 8px; }
.hint-icon { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; background: #fef3c7; color: #b45309; font-weight: 700; font-size: 12px; cursor: help; }
.field-link { font-size: 12px; color: #2563eb; text-decoration: underline; }
.token-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.token-btn {
  padding: 4px 12px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.token-btn:hover {
  background: #dbeafe;
  border-color: #93c5fd;
}
.upload-progress {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #ffffff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
  border-radius: 12px;
  padding: 12px 16px;
  z-index: 1200;
  min-width: 320px;
}
.upload-progress-bar {
  width: 100%;
  height: 8px;
  background: #f3f4f6;
  border-radius: 99px;
  overflow: hidden;
}
.upload-progress-inner {
  height: 8px;
  background: var(--primary-color);
  width: 0%;
}
.upload-progress-text {
  margin-top: 8px;
  font-size: 12px;
  color: #374151;
  text-align: right;
}
/* Update modal spacing and hint color */
.modal-container.update-modal .modal-form .form-group {
  margin-bottom: 24px;
}
.modal-container.update-modal .modal-form .field-hint {
  color: #f59e0b;
  font-weight: 500;
}
/* Level Discount composite input */
.level-discount-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.level-discount-group .ld-add-row {
  display: flex;
  justify-content: flex-end;
}
.level-discount-group .ld-add-btn {
  padding: 6px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f9fafb;
  cursor: pointer;
}
.level-discount-group .ld-add-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.level-discount-group .ld-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.level-discount-group .ld-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  position: relative;
}
.level-discount-group .ld-display {
  flex: 1;
}
.level-discount-group .ld-editor {
  display: flex;
  align-items: center;
  gap: 8px;
  position: absolute;
  left: calc(100% + 8px);
  top: 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
}
.level-discount-group .ld-level {
  width: 140px;
}
.level-discount-group .ld-discount {
  width: 160px;
}
.ld-del-btn {
  padding: 4px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}
.side-editor {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  width: 360px;
  max-height: 85vh;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 50%;
  left: calc(50% + 216px);
  transform: translateY(-50%);
  margin-left: 0;
}
.side-editor-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
}
.side-editor-body {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}
.side-editor-footer {
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.modal-container.create-detail-modal .modal-form .form-group {
  margin-bottom: 24px;
}
.modal-container.create-detail-modal .modal-form .field-hint {
  color: #f59e0b;
  font-weight: 500;
}
</style>
.modal-container.update-modal .modal-form .form-group {
  margin-bottom: 18px;
}
.modal-container.update-modal .modal-form .field-hint {
  color: #f59e0b;
  font-weight: 500;
}
.modal-container.login-modal {
  width: 400px;
  border: none;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}
.login-modal .modal-header {
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  color: #fff;
  padding: 20px 24px;
}
.login-modal .modal-header h3 {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.login-modal .modal-header .close-btn {
  color: rgba(255, 255, 255, 0.8);
}
.login-modal .modal-header .close-btn:hover {
  color: #fff;
}
.login-modal .modal-body {
  padding: 32px 32px 24px;
}
.login-modal .modal-footer {
  background: #f9fafb;
  padding: 16px 32px 24px;
  border-top: none;
  justify-content: center;
}
.login-modal .modal-footer button {
  width: 100%;
  justify-content: center;
  padding: 10px 20px;
  font-size: 15px;
  border-radius: 8px;
}
.login-modal .form-group {
  margin-bottom: 20px;
}
.login-modal .form-group label {
  color: #4b5563;
  font-weight: 600;
  margin-bottom: 8px;
}
.login-modal .form-group .form-input {
  border-radius: 8px;
  border: 1px solid #d1d5db;
  padding: 12px 16px;
  background-color: #f9fafb;
  transition: all 0.2s;
}
.login-modal .form-group .form-input:focus {
  background-color: #fff;
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}
