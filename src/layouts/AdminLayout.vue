<template>
  <div class="admin">
    <layout-header @toggle="toggleSidebar" />
    <div class="admin-body" :class="{ collapsed: sidebarCollapsed }">
      <layout-sidebar :collapsed="sidebarCollapsed" />
      <main class="admin-content">
        <router-view />
      </main>
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
            <div v-for="(item, idx) in modal.data" :key="idx">
              <div v-if="item && item.type === 'image'" class="detail-image">
                <div v-if="item.label" class="detail-label">{{ item.label }}</div>
                <img :src="item.src || item.value" alt="preview" />
              </div>
              <div v-else class="detail-row">
                <div class="detail-label">{{ item.label }}</div>
                <div class="detail-value">{{ item.value }}</div>
              </div>
            </div>
          </div>
          <div v-else-if="modal.type === 'form'" class="modal-form">
            <!-- Dynamic form fields based on modal.fields -->
            <div v-for="(field, key) in modal.fields" :key="key" class="form-group">
              <label>{{ field.label }}</label>
              <input 
                v-if="field.type === 'text' || field.type === 'number' || field.type === 'password' || field.type === 'email'" 
                :type="field.type" 
                v-model="field.value" 
                class="form-input" 
              />
              <input 
                v-else-if="field.type === 'file'" 
                type="file" 
                :multiple="field.multiple"
                @change="(e) => { field.files = e.target.files; if(field.onChange) field.onChange(e) }"
                class="form-input" 
              />
              <select v-else-if="field.type === 'select'" v-model="field.value" class="form-select">
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
              <div v-if="field.hint" class="field-hint">{{ field.hint }}</div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-sm" @click="closeModal">取消</button>
          <button class="btn-sm primary" @click="confirmModal">确定</button>
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
    const showToast = (msg) => {
      const m = String(msg || '')
      if (!m) return
      toasts.push(m)
      setTimeout(() => {
        const i = toasts.indexOf(m)
        if (i >= 0) toasts.splice(i, 1)
      }, 2000)
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
    provide('confirmDialog', confirmDialog)

    return {
      modal,
      closeModal,
      confirmModal,
      toasts
    }
  },
  methods: {
    toggleSidebar () {
      this.sidebarCollapsed = !this.sidebarCollapsed
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
    gap: 8px;
    align-items: center;
  }
  .detail-image img {
    max-width: 100%;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }
  
  .form-group {
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
</style>
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
