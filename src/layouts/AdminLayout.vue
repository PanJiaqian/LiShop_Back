<!--
  模块: 后台管理布局
  作用: 提供管理端统一骨架（头部/侧边栏/内容区），并承载全局弹窗与上传进度展示
-->
<template>
  <div class="admin">
    <layout-header @toggle="toggleSidebar" />
    <div class="admin-body" :class="{ collapsed: sidebarCollapsed }">
      <layout-sidebar :collapsed="sidebarCollapsed" />
      <main class="admin-content">
        <div v-if="pageLoading" class="page-skeleton">
          <div class="page-skeleton-title"></div>
          <div class="page-skeleton-card">
            <div class="page-skeleton-filters">
              <div class="skeleton-line w-24"></div>
              <div class="skeleton-line w-24"></div>
              <div class="skeleton-line w-18"></div>
              <div class="skeleton-line w-18"></div>
              <div class="skeleton-line w-12"></div>
            </div>
            <div class="page-skeleton-table">
              <div class="page-skeleton-row header">
                <div class="skeleton-cell w-10"></div>
                <div class="skeleton-cell w-18"></div>
                <div class="skeleton-cell w-12"></div>
                <div class="skeleton-cell w-14"></div>
                <div class="skeleton-cell w-16"></div>
                <div class="skeleton-cell w-12"></div>
              </div>
              <div class="page-skeleton-row" v-for="i in 9" :key="i">
                <div class="skeleton-cell w-10"></div>
                <div class="skeleton-cell w-18"></div>
                <div class="skeleton-cell w-12"></div>
                <div class="skeleton-cell w-14"></div>
                <div class="skeleton-cell w-16"></div>
                <div class="skeleton-cell w-12"></div>
              </div>
            </div>
          </div>
        </div>
        <div :class="{ 'page-loading-hidden': pageLoading }">
          <router-view v-slot="{ Component }">
            <keep-alive :max="20">
              <component :is="Component" :key="$route.fullPath" />
            </keep-alive>
          </router-view>
        </div>
      </main>
    </div>

    <div v-if="upload.active" class="upload-progress">
      <div class="upload-progress-bar">
        <div class="upload-progress-inner" :style="{ width: upload.percent + '%' }"></div>
      </div>
      <div class="upload-progress-text">{{ upload.text }} {{ upload.percent }}%</div>
    </div>

    <!-- Global Modal Component -->
    <div v-if="modal.show" class="modal-overlay" @mousedown="handleOverlayClick">
      <div class="modal-container" :class="modal.className" @mousedown.stop>
        <div class="modal-header">
          <h3>{{ modal.title }}</h3>
          <button v-if="!modal.forceConfirm" class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="modal.type === 'confirm'" class="modal-message">
            {{ modal.message }}
          </div>
          <div v-else-if="modal.type === 'result'" class="modal-result">
            <div class="result-summary">
              <div class="summary-item"><span class="label">状态</span><span class="value">{{ (modal.result && modal.result.success) ? '成功' : '失败' }}</span></div>
              <div class="summary-item wide" v-if="modal.result && modal.result.timestamp"><span class="label">时间</span><span class="value">{{ formatTimestamp(modal.result.timestamp) }}</span></div>
              <div class="summary-item wide" v-if="modal.result && modal.result.message"><span class="label">说明</span><span class="value">{{ modal.result.message }}</span></div>
              <div class="summary-item" v-if="modal.result && modal.result.data && (modal.result.data.failure_count != null)"><span class="label">失败条数</span><span class="value">{{ modal.result.data.failure_count }}</span></div>
            </div>
            <div v-if="modal.result && modal.result.data != null">
              <table v-if="Array.isArray(modal.result.data.failures) && modal.result.data.failures.length" class="result-table">
                <thead>
                  <tr>
                    <th>行</th>
                    <th>名称</th>
                    <th>原因</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(f, i) in modal.result.data.failures" :key="i">
                    <td>{{ (f && f.row) != null ? f.row : '' }}</td>
                    <td>{{ f && (f.name || f.username) }}</td>
                    <td>{{ f && f.reason }}</td>
                  </tr>
                </tbody>
              </table>
              <div v-else-if="Array.isArray(modal.result.data)" class="result-list">
                <div class="list-item" v-for="(t, i) in modal.result.data" :key="i">{{ t }}</div>
              </div>
              <div v-else-if="isResultDataScalar(modal.result.data)" class="result-text">{{ formatResultDataText(modal.result.data) }}</div>
              <div v-else-if="getResultDataRows(modal.result.data).length" class="result-list">
                <div class="list-item" v-for="(row, i) in getResultDataRows(modal.result.data)" :key="i">{{ row.label }}: {{ row.value }}</div>
              </div>
            </div>
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
              <div v-else-if="item && item.type === 'image-row'" class="detail-image-row">
                <div v-if="item.label" class="detail-label">{{ item.label }}</div>
                <div class="image-row-container">
                  <div
                    v-for="(src, i) in (item.images || [])"
                    :key="i"
                    class="image-row-thumb"
                    @click="enlargeDetailImage(src)"
                  >
                    <img :src="src" alt="thumb" />
                  </div>
                </div>
              </div>
              <div v-else-if="item && item.type === 'video-row'" class="detail-video-row">
                <div v-if="item.label" class="detail-label">{{ item.label }}</div>
                <div class="video-row-container">
                  <div
                    v-for="(src, i) in (item.videos || [])"
                    :key="i"
                    class="video-row-thumb"
                    @click="enlargeDetailVideo(src)"
                  >
                    <video
                      :src="normalizeMediaUrl(src)"
                      class="video-row-player"
                      muted
                      playsinline
                      preload="metadata"
                    ></video>
                  </div>
                </div>
              </div>
              <div v-else-if="item && item.type === 'video'" class="detail-video">
                <div v-if="item.label" class="detail-label">{{ item.label }}</div>
                <video
                  :src="normalizeMediaUrl(item.src || item.value)"
                  :class="item.large ? 'detail-video-player detail-video-player-large' : 'detail-video-player'"
                  :controls="!!item.large"
                  muted
                  playsinline
                  @click="enlargeDetailVideo(item.src || item.value)"
                ></video>
              </div>
              <div v-else-if="item && item.type === 'token-row'" class="detail-row">
                <div class="detail-label">{{ item.label }}</div>
                <div class="detail-value" v-html="renderFormulaTokenHtml(item.value, item.tokenLabelMap)"></div>
              </div>
              <div v-else class="detail-row">
                <div class="detail-label">{{ item.label }}</div>
                <div class="detail-value">{{ formatMaybeTime(item.value) }}</div>
              </div>
            </div>
          </div>
          <div v-else-if="modal.type === 'form'" class="modal-form">
            <!-- Dynamic form fields based on modal.fields -->
            <template v-for="(field, key) in modal.fields" :key="key">
              <div class="form-group" v-if="!(field && field.hidden)">
                <div class="label-row">
                  <label>
                    <span v-if="field.required" class="required-mark">*</span>
                    {{ field.label }}
                  </label>
                  <span v-if="field.tooltip" class="hint-icon" :title="field.tooltip">!</span>
                  <a v-if="field.link" :href="field.link" target="_blank" class="field-link">{{ field.linkText || '查看公司列表' }}</a>
                </div>
                <div
                  v-if="field.showTokens && (field.type === 'text' || field.type === 'number' || field.type === 'password' || field.type === 'email')"
                  :key="'token-input-' + key + '-' + (field._rev || 0)"
                  class="form-input token-input"
                  contenteditable="true"
                  spellcheck="false"
                  v-html="renderFormulaTokenHtml(field.value, field.tokenLabelMap)"
                  @input="(e) => { field.value = normalizeFormulaInput(e.target.innerText, field.tokenLabelMap) }"
                  @focus="(e) => { if(field.onFocus) field.onFocus(e) }"
                  @click="(e) => { if(field.onClick) field.onClick(e) }"
                ></div>
                <input
                  v-else-if="field.type === 'text' || field.type === 'number' || field.type === 'password' || field.type === 'email' || field.type === 'datetime-local' || field.type === 'date' || field.type === 'time'"
                  :type="field.type"
                  v-model="field.value"
                  :readonly="!!field.readonly"
                  :disabled="!!field.disabled"
                  :class="['form-input', { 'readonly-input': field.readonly, 'disabled-input': field.disabled }]"
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
                           :value="row ? (`等级${row.level}:${Math.round(parseFloat(row.discount) * 100)}%`) : ''"
                           :placeholder="row ? '' : '点击设置'"
                           @click="() => openLevelDiscountEditor(field, idx, row)" />
                    <button class="ld-del-btn" @click="() => removeLevelDiscountRow(field, idx)">×</button>
                  </div>
                </div>
              </div>
              <div v-else-if="field.type === 'file'" class="file-input-wrapper">
                <input
                  type="file"
                  :ref="'file-'+key"
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
                  class="file-input-hidden"
                />
                <div class="file-input-actions">
                  <button class="btn-sm" @click="openFileChooser(key, $event)">选择文件</button>
                  <span v-if="Array.isArray(field.files) && field.files.length" class="file-count">已选择 {{ field.files.length }} 个</span>
                </div>
                <div v-if="Array.isArray(field.existing) && field.existing.length" class="file-thumb-list">
                  <div v-for="(u, i) in field.existing" :key="i" class="file-thumb-item">
                    <div class="thumb" @click="previewSelectedFile(u)">
                      <img v-if="isImageUrl(u)" :src="normalizeMediaUrl(u)" />
                      <video
                        v-else-if="isVideoUrl(u)"
                        :src="normalizeMediaUrl(u)"
                        class="file-thumb-video"
                        muted
                        playsinline
                        preload="metadata"
                      ></video>
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
              <select v-else-if="field.type === 'select'" v-model="field.value" :disabled="!!field.disabled" :class="['form-select', field.disabled ? 'disabled-select' : '']" @change="(e) => { if(field.onChange) field.onChange(e, modal.fields) }">
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
      <button v-for="opt in field.options" :key="opt.value" class="token-btn" @click="() => { const t = modal.fields[field.target]; t.value += opt.value; t._rev = (t._rev || 0) + 1 }">
        {{ opt.label }}
      </button>
    </div>
    <div v-if="field.hint" class="field-hint">{{ field.hint }}</div>
              </div>
            </template>
          </div>
        </div>
        <div class="modal-footer" v-if="!modal.isPreview">
          <button class="btn-sm" v-if="!modal.forceConfirm" @click="closeModal">取消</button>
          <button class="btn-sm primary" @click="confirmModal">确定</button>
        </div>
      </div>
      <div v-if="sideEditor.visible" class="side-editor" @mousedown.stop @click.stop>
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
            <label>折扣（%）</label>
            <input class="form-input" type="number" step="1" min="0" max="100" placeholder="示例：92 表示92%折扣" v-model="sideEditor.discount" />
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
import { reactive, provide, watch, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, buildApiMessage, resolveApiErrorMessage, resolveApiResultMessage } from '@/api/admin'
import { deleteProductFile } from '@/api/product'

export default {
  name: 'AdminLayout',
  components: { LayoutHeader, LayoutSidebar },
  data () {
    return {
      sidebarCollapsed: false
    }
  },
  setup () {
    const pageLoading = ref(true)
    const router = useRouter()
    let hideTimer = null
    let minUntil = 0
    const showPageLoading = () => {
      if (hideTimer) {
        clearTimeout(hideTimer)
        hideTimer = null
      }
      pageLoading.value = true
      minUntil = Date.now() + 250
    }
    const hidePageLoading = () => {
      const delay = Math.max(0, minUntil - Date.now())
      hideTimer = setTimeout(() => {
        pageLoading.value = false
        hideTimer = null
      }, delay)
    }

    const removeBefore = router.beforeEach((to, from, next) => {
      showPageLoading()
      next()
    })
    const removeAfter = router.afterEach(async () => {
      try { await nextTick() } catch (e) {}
      try {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            hidePageLoading()
          })
        })
      } catch (e) {
        hidePageLoading()
      }
    })
    onMounted(() => {
      try {
        window.addEventListener('shopback-api-error', handleApiErrorEvent)
      } catch (e) {}
      try {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            hidePageLoading()
          })
        })
      } catch (e) {
        hidePageLoading()
      }
    })
    onBeforeUnmount(() => {
      try {
        window.removeEventListener('shopback-api-error', handleApiErrorEvent)
      } catch (e) {}
      try { if (typeof removeBefore === 'function') removeBefore() } catch (e) {}
      try { if (typeof removeAfter === 'function') removeAfter() } catch (e) {}
      if (hideTimer) {
        clearTimeout(hideTimer)
        hideTimer = null
      }
    })

    const auth = useAuthStore()
    watch(() => [auth.token, auth.expiresAt], () => {
      try { window.location.reload() } catch (e) {}
    })
    const modal = reactive({
      show: false,
      type: 'confirm', // 'confirm', 'form', 'detail'
      title: '',
      message: '',
      fields: {},
      data: [],
      onConfirm: null,
      className: '',
      isPreview: false,
      backup: null,
      forceConfirm: false,
      result: null
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
    const lastApiError = reactive({
      text: '',
      at: 0
    })

    const showModal = (options) => {
      modal.type = options.type || 'confirm'
      modal.title = options.title || '提示'
      modal.message = options.message || ''
      modal.fields = options.fields || {}
      modal.data = options.data || []
      modal.onConfirm = options.onConfirm
      modal.className = options.className || ''
      modal.isPreview = false
      modal.backup = null
      modal.forceConfirm = !!(options && options.forceConfirm)
      modal.result = options.result || null
      modal.show = true
    }

    const closeModal = () => {
      if (modal.isPreview && modal.backup) {
        const b = modal.backup
        modal.type = b.type
        modal.title = b.title
        modal.message = b.message
        modal.fields = b.fields
        modal.data = b.data
        modal.onConfirm = b.onConfirm
        modal.className = b.className
        modal.isPreview = false
        modal.backup = null
        modal.show = true
      } else {
        modal.show = false
        cancelLevelDiscountEditor()
      }
    }

    const confirmModal = () => {
      if (modal.onConfirm) {
        modal.onConfirm(modal.fields)
      }
      closeModal()
    }

    provide('showModal', showModal)
    const toasts = reactive([])

    /**
     * 判断 toast 文案是否属于信息量较低的兜底提示。
     * @param {string} text 提示文本
     * @returns {boolean} 是否为兜底提示
     */
    const isGenericFallbackToast = (text) => {
      const value = String(text || '').trim()
      return /^(请求失败|导入请求失败|获取.+失败|创建失败|更新失败|删除失败|更改失败|更改请求失败|状态更新失败|状态更新请求失败)$/.test(value)
    }

    /**
     * 监听 axios 拦截器派发的全局接口错误事件。
     * @param {CustomEvent} event 事件对象
     */
    const handleApiErrorEvent = (event) => {
      const message = buildApiMessage(event && event.detail && event.detail.message, '', '')
      if (!message) return
      lastApiError.text = message
      lastApiError.at = Date.now()
      showToast({ text: message, source: 'api-error' })
    }

    /**
     * 统一解析字符串、返回包体和异常对象，避免后端 data 错误详情丢失。
     * @param {unknown} arg Toast 输入参数
     * @returns {string} 已展示的文案
     */
    const showToast = (arg) => {
      const isErrorLike = arg instanceof Error || !!(arg && arg.response)
      const isObj = typeof arg === 'object' && arg !== null
      let m = ''
      if (isErrorLike) {
        m = resolveApiErrorMessage(arg, '')
      } else if (isObj && arg.error) {
        m = resolveApiErrorMessage(arg.error, arg.fallback || '')
      } else if (isObj && arg.result) {
        m = resolveApiResultMessage(arg.result, arg.fallback || '')
      } else {
        m = String(isObj ? (arg.text || arg.message || arg.msg || '') : (arg || ''))
      }
      if (!m) return ''
      if ((!isObj || arg.source !== 'api-error') && isGenericFallbackToast(m) && lastApiError.text && (Date.now() - lastApiError.at) < 1500) {
        return lastApiError.text
      }
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
    provide('resolveApiMessage', (source, fallback = '操作失败') => {
      if (source && source.response) return resolveApiErrorMessage(source, fallback)
      return resolveApiResultMessage(source, fallback)
    })
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
      const rawDiscount = row ? parseFloat(row.discount) : ''
      sideEditor.discount = rawDiscount !== '' && !isNaN(rawDiscount) ? String(Math.round(rawDiscount * 100)) : ''
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
      const pctVal = String(sideEditor.discount || '').trim()
      const arr = Array.isArray(field.entries) ? [...field.entries] : []
      const isEdit = sideEditor.index < arr.length
      if (!sel || !pctVal) { showToast('请先选择等级并填写折扣'); return }
      const pctNum = parseFloat(pctVal)
      if (isNaN(pctNum) || pctNum < 0 || pctNum > 100) { showToast('折扣需在0~100之间'); return }
      const decimalVal = String(pctNum / 100)
      const dup = arr.some((d, i) => i !== (isEdit ? sideEditor.index : -1) && String(d.level) === sel)
      if (dup) { showToast('不得重复设定同一等级折扣'); return }
      if (isEdit) {
        arr[sideEditor.index] = { level: sel, discount: decimalVal }
      } else {
        if (arr.length >= (field.max || 3)) { showToast('最多添加三条等级折扣'); return }
        arr.push({ level: sel, discount: decimalVal })
        field.newRows = Math.max(0, (field.newRows || 0) - 1)
      }
      field.entries = arr
      try { field.value = JSON.stringify(arr) } catch (e) { field.value = '[]' }
      field.display = arr.map(d => `等级${d.level}:${Math.round(parseFloat(d.discount) * 100)}%`).join('; ')
      cancelLevelDiscountEditor()
    }
    const removeLevelDiscountRow = (field, idx) => {
      const arr = Array.isArray(field.entries) ? [...field.entries] : []
      if (idx < arr.length) {
        arr.splice(idx, 1)
        field.entries = arr
        try { field.value = JSON.stringify(arr) } catch (e) { field.value = '[]' }
        field.display = arr.map(d => `等级${d.level}:${Math.round(parseFloat(d.discount) * 100)}%`).join('; ')
      } else {
        field.newRows = Math.max(0, (field.newRows || 0) - 1)
      }
      if (sideEditor.field === field && sideEditor.index === idx) cancelLevelDiscountEditor()
    }

    return {
      pageLoading,
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
    normalizeMediaUrl (u) {
      try {
        let s = String(u || '').trim()
        s = s.replace(/^`+|`+$/g, '')
        s = s.replace(/^"+|"+$/g, '')
        s = s.replace(/^'+|'+$/g, '')
        s = s.trim()
        if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return ''
        return s
      } catch (e) {
        return ''
      }
    },
    escapeHtml (s) {
      try {
        return String(s || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
      } catch (e) {
        return ''
      }
    },
    escapeRegExp (s) {
      try {
        return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      } catch (e) {
        return ''
      }
    },
    renderFormulaTokenHtml (val, labelMap) {
      try {
        const s = String(val || '')
        if (!s) return ''
        const map = (labelMap && typeof labelMap === 'object') ? labelMap : {}
        const re = /[a-zA-Z_]\w*|\d+(?:\.\d+)?|[()+\-*/]/g
        let html = ''
        let lastIndex = 0
        let m
        while ((m = re.exec(s))) {
          const raw = m[0]
          const before = s.slice(lastIndex, m.index)
          if (before) html += this.escapeHtml(before)
          if (map[raw]) {
            html += `<span class="token-chip" contenteditable="false">${this.escapeHtml(map[raw])}</span>&#8203;`
          } else {
            html += this.escapeHtml(raw)
          }
          lastIndex = re.lastIndex
        }
        const rest = s.slice(lastIndex)
        if (rest) html += this.escapeHtml(rest)
        return html
      } catch (e) {
        return ''
      }
    },
    normalizeFormulaInput (text, labelMap) {
      try {
        let s = String(text || '')
        if (!s) return ''
        s = s.replace(/\u200B/g, '')
        s = s.replace(/\s+/g, ' ').trim()
        const map = (labelMap && typeof labelMap === 'object') ? labelMap : {}
        const reverse = {}
        Object.keys(map).forEach(k => { reverse[map[k]] = k })
        Object.keys(reverse).forEach(label => {
          const re = new RegExp(this.escapeRegExp(label), 'g')
          s = s.replace(re, reverse[label])
        })
        return s
      } catch (e) {
        return String(text || '')
      }
    },
    isTokenInputLocked (e) {
      try {
        const sel = (typeof window !== 'undefined' && window.getSelection) ? window.getSelection() : null
        if (!sel || !sel.rangeCount) return false
        const range = sel.getRangeAt(0)
        const tokenClass = 'token-chip'
        const target = e && e.target
        const isTokenNode = node => node && node.nodeType === 1 && node.classList && node.classList.contains(tokenClass)
        const hasTokenAncestor = node => {
          let cur = node
          while (cur && cur !== target) {
            if (isTokenNode(cur)) return true
            cur = cur.parentNode
          }
          return false
        }
        if (hasTokenAncestor(range.startContainer) || hasTokenAncestor(range.endContainer)) return true
        if (!range.collapsed && range.cloneContents) {
          const frag = range.cloneContents()
          if (frag && frag.querySelector && frag.querySelector('.' + tokenClass)) return true
        }
        if (e && e.inputType && String(e.inputType).startsWith('delete') && range.collapsed) {
          let prev = null
          let next = null
          if (range.startContainer && range.startContainer.nodeType === 3) {
            const textNode = range.startContainer
            const offset = range.startOffset
            if (offset === 0) prev = textNode.previousSibling
            if (offset === (textNode.nodeValue || '').length) next = textNode.nextSibling
          } else if (range.startContainer && range.startContainer.nodeType === 1) {
            const el = range.startContainer
            const offset = range.startOffset
            prev = el.childNodes[offset - 1]
            next = el.childNodes[offset]
          }
          if (isTokenNode(prev) || isTokenNode(next)) return true
        }
        return false
      } catch (e) {
        return false
      }
    },
    formatTimestamp (ts) {
      try {
        let s = String(ts || '').trim()
        if (!s) return ''
        s = s.replace(/`/g, '')
        // 2026-01-12T10:13:39.576753 -> 2026-01-12 10:13:39
        const m = s.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/)
        if (m) return `${m[1]} ${m[2]}`
        const d = new Date(s)
        if (!isNaN(d.getTime())) {
          const pad = n => String(n).padStart(2, '0')
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
        }
        return s
      } catch (e) { return String(ts || '') }
    },
    formatMaybeTime (v) {
      try {
        const s = String(v == null ? '' : v).trim()
        if (!s) return ''
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(s)) {
          return s.replace('T', ' ').replace(/Z$/, '').split('.')[0]
        }
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) {
          return s.replace(/Z$/, '').split('.')[0]
        }
        return v
      } catch (e) {
        return v
      }
    },
    toggleSidebar () {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    isImageUrl (u) {
      try {
        const s = this.normalizeMediaUrl(u).toLowerCase()
        return /\.(png|jpg|jpeg|gif|bmp|webp)(\?.*)?$/.test(s)
      } catch (e) { return false }
    },
    isVideoUrl (u) {
      try {
        const s = this.normalizeMediaUrl(u).toLowerCase()
        return /\.(mp4|mov|webm|ogg|m3u8)(\?.*)?$/.test(s)
      } catch (e) { return false }
    },
    basename (u) {
      try {
        const s = this.normalizeMediaUrl(u)
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
      if (Array.isArray(field.files)) {
        const removed = field.files.splice(i, 1)[0]
        const URLRef = (typeof window !== 'undefined' && (window.URL || window.webkitURL)) || null
        if (removed && removed._previewUrl && URLRef && typeof URLRef.revokeObjectURL === 'function') {
          try { URLRef.revokeObjectURL(removed._previewUrl) } catch (e) {}
        }
      }
    },
    previewSelectedFile (f) {
      let src = ''
      let isImg = false
      let isVideo = false
      try {
        if (f && typeof f === 'object' && (f instanceof Blob)) {
          isImg = String(f.type || '').startsWith('image/')
          isVideo = String(f.type || '').startsWith('video/')
          if (!isVideo) {
            const nm = String((f && f.name) || '').toLowerCase()
            if (/\.(mp4|mov|webm|ogg|m3u8)(\?.*)?$/.test(nm)) {
              isVideo = true
            }
          }
          src = this.getFileObjectURL(f)
        } else if (typeof f === 'string') {
          src = this.normalizeMediaUrl(f)
          isImg = this.isImageUrl(src)
          isVideo = this.isVideoUrl(src)
        }
      } catch (e) {
        src = ''
      }
      if (!src) return
      const item = isImg ? { type: 'image', src, large: true } : (isVideo ? { type: 'video', src, large: true } : { type: '', value: (f && f.name) || '' })
      if (this.modal.isPreview) {
        this.modal.type = 'detail'
        this.modal.title = '文件预览'
        this.modal.data = [item]
        this.modal.onConfirm = null
        this.modal.show = true
        this.initHlsInCurrentModal()
        return
      }
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
      this.modal.onConfirm = null
      this.modal.isPreview = true
      this.modal.backup = backup
      this.modal.show = true
      this.initHlsInCurrentModal()
    },
    confirmDeleteExistingUrl (field, i) {
      const t = this
      const backup = {
        type: t.modal.type,
        title: t.modal.title,
        message: t.modal.message,
        fields: t.modal.fields,
        data: t.modal.data,
        onConfirm: t.modal.onConfirm,
        className: t.modal.className
      }
      const rawName = Array.isArray(field.existing) ? String(field.existing[i]) : ''
      const fileName = String(rawName || '').replace(/^`+|`+$/g, '').trim()
      t.modal.type = 'confirm'
      t.modal.title = '确认删除'
      t.modal.message = `确定要删除${String(field.label || '该文件')}吗？`
      t.modal.fields = {}
      t.modal.data = []
      t.modal.onConfirm = async () => {
        try {
          const pid = (backup.fields && backup.fields.product_id && backup.fields.product_id.value) ? String(backup.fields.product_id.value) : ''
          const label = String(field.label || '')
          let fileType = ''
          if (label.includes('主图')) fileType = 'main_image'
          else if (label.includes('轮播图')) fileType = 'images'
          else if (label.includes('视频')) fileType = 'video'
          const fd = new FormData()
          fd.append('product_id', pid)
          fd.append('file_name', fileName)
          if (fileType) fd.append('file_type', fileType)
          const body = await deleteProductFile(fd)
          if (body && body.success) {
            if (Array.isArray(field.existing)) field.existing.splice(i, 1)
            t.showToast(body.message || '删除成功')
          } else {
            const msg = resolveApiResultMessage(body, '删除失败')
            t.showToast(String(msg))
          }
        } catch (e) {
          t.showToast({ error: e, fallback: '删除失败' })
        }
      }
      t.modal.className = ''
      t.modal.isPreview = true
      t.modal.backup = backup
      t.modal.show = true
    },
    /**
     * 判断结果弹窗的 data 是否为可直接展示的标量值。
     * @param {unknown} data 结果数据
     * @returns {boolean} 是否为标量数据
     */
    isResultDataScalar (data) {
      return ['string', 'number', 'boolean'].includes(typeof data)
    },
    /**
     * 将标量结果数据格式化为文本。
     * @param {unknown} data 结果数据
     * @returns {string} 展示文本
     */
    formatResultDataText (data) {
      return String(data == null ? '' : data)
    },
    /**
     * 将对象型结果数据转换为键值对列表，便于结果弹窗展示。
     * @param {unknown} data 结果数据
     * @returns {Array<{label: string, value: string}>} 可展示的键值对
     */
    getResultDataRows (data) {
      if (!data || typeof data !== 'object' || Array.isArray(data)) return []
      return Object.keys(data)
        .filter(key => key !== 'failures')
        .map(key => {
          const value = data[key]
          if (value == null) return null
          if (typeof value === 'object') {
            const text = buildApiMessage('', value, '')
            return text ? { label: key, value: text } : null
          }
          return { label: key, value: String(value) }
        })
        .filter(Boolean)
    },
    enlargeDetailImage (url) {
      url = this.normalizeMediaUrl(url)
      if (!url) return
      if (this.modal.isPreview) {
        this.modal.type = 'detail'
        this.modal.title = '图片预览'
        this.modal.data = [{ type: 'image', value: url, large: true }]
        this.modal.onConfirm = null
        this.modal.show = true
        return
      }
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
      this.modal.onConfirm = null
      this.modal.isPreview = true
      this.modal.backup = backup
      this.modal.show = true
    },
    enlargeDetailVideo (url) {
      url = this.normalizeMediaUrl(url)
      if (!url) return
      if (this.modal.isPreview) {
        this.modal.type = 'detail'
        this.modal.title = '视频预览'
        this.modal.data = [{ type: 'video', value: url, large: true }]
        this.modal.onConfirm = null
        this.modal.show = true
        this.initHlsInCurrentModal()
        return
      }
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
      this.modal.title = '视频预览'
      this.modal.data = [{ type: 'video', value: url, large: true }]
      this.modal.onConfirm = null
      this.modal.isPreview = true
      this.modal.backup = backup
      this.modal.show = true
      this.initHlsInCurrentModal()
    },
    async initHlsInCurrentModal () {
      try {
        const container = document.querySelector('.modal-container')
        if (!container) return
        const videos = container.querySelectorAll('video')
        const HlsCtor = await this.ensureHls()
        videos.forEach(v => {
          const src = v.getAttribute('src')
          if (!src) return
          const isM3u8 = /\.m3u8(\?.*)?$/.test(String(src).toLowerCase())
          if (!isM3u8) return
          try {
            if (v.canPlayType && v.canPlayType('application/vnd.apple.mpegURL')) {
              v.src = src
              v.load()
              v.setAttribute('controls', 'true')
              return
            }
            if (HlsCtor && HlsCtor.isSupported()) {
              const h = new HlsCtor()
              h.loadSource(src)
              h.attachMedia(v)
              v.setAttribute('controls', 'true')
            }
          } catch (e) {}
        })
      } catch (e) {}
    },
    ensureHls () {
      return new Promise(resolve => {
        try {
          if (window.Hls && window.Hls.isSupported && window.Hls.isSupported()) {
            resolve(window.Hls)
            return
          }
          const existed = document.querySelector('script[data-hlsjs]')
          if (existed) {
            const done = () => resolve(window.Hls || null)
            existed.addEventListener('load', done, { once: true })
            existed.addEventListener('error', () => resolve(null), { once: true })
            return
          }
          const s = document.createElement('script')
          s.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest'
          s.setAttribute('data-hlsjs', '1')
          s.onload = () => resolve(window.Hls || null)
          s.onerror = () => resolve(null)
          document.head.appendChild(s)
        } catch (e) {
          resolve(null)
        }
      })
    },
    handleOverlayClick () {
      const selection = window.getSelection()
      if (selection && selection.toString().length > 0) {
        return
      }
      if (this.modal.forceConfirm) return
      this.closeModal()
    },
    openFileChooser (key, e) {
      let el = null
      try {
        const wrapper = e && e.target && e.target.closest && e.target.closest('.file-input-wrapper')
        if (wrapper) {
          el = wrapper.querySelector('input[type="file"]')
        }
      } catch (err) {}
      if (!el) {
        const refName = 'file-' + String(key)
        el = this.$refs && this.$refs[refName]
        if (Array.isArray(el)) el = el[0]
      }
      if (el && typeof el.click === 'function') el.click()
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
  position: relative;
  padding: 24px;
  background-color: var(--bg-color);
}

.disabled-select {
  cursor: not-allowed;
}

.page-loading-hidden {
  visibility: hidden;
}

.page-skeleton {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24px;
  background: var(--bg-color);
  z-index: 50;
  overflow: hidden;
}

.page-skeleton-title {
  height: 28px;
  width: 200px;
  border-radius: 10px;
  background: #e5e7eb;
  margin-bottom: 18px;
  position: relative;
  overflow: hidden;
}

.page-skeleton-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(229, 231, 235, 0.6);
  padding: 18px;
  overflow: hidden;
}

.page-skeleton-filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.page-skeleton-table {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.page-skeleton-row {
  display: grid;
  grid-template-columns: 1fr 2fr 1.2fr 1.4fr 1.6fr 1.2fr;
  gap: 12px;
  align-items: center;
}

.page-skeleton-row.header {
  opacity: 0.85;
}

.skeleton-line,
.skeleton-cell,
.page-skeleton-title {
  background: #e5e7eb;
}

.skeleton-line {
  height: 34px;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}

.skeleton-cell {
  height: 14px;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.w-10 { width: 56px; }
.w-12 { width: 84px; }
.w-14 { width: 110px; }
.w-16 { width: 140px; }
.w-18 { width: 170px; }
.w-24 { width: 220px; }

.skeleton-line::after,
.skeleton-cell::after,
.page-skeleton-title::after {
  content: '';
  position: absolute;
  top: 0;
  left: -40%;
  height: 100%;
  width: 40%;
  background: linear-gradient(90deg, rgba(229,231,235,0) 0%, rgba(255,255,255,0.7) 50%, rgba(229,231,235,0) 100%);
  animation: skeletonShimmer 1.2s ease-in-out infinite;
}

@keyframes skeletonShimmer {
  0% { left: -40%; }
  100% { left: 100%; }
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
  width: 600px;
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
  .modal-result {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .result-summary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 12px;
  }
  .summary-item { display: inline-flex; gap: 8px; font-size: 14px; color: #374151; }
  .summary-item .label { width: 72px; color: #6b7280; flex-shrink: 0; }
  .summary-item .value { flex: 1; word-break: break-all; }
  .summary-item.wide { grid-column: 1 / -1; }
  .result-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #e5e7eb;
  }
  .result-table th, .result-table td {
    border: 1px solid #e5e7eb;
    padding: 8px 10px;
    font-size: 13px;
    text-align: left;
  }
  .result-table thead th { background: #f9fafb; color: #6b7280; }
  .result-list { display: flex; flex-direction: column; gap: 6px; }
  .result-list .list-item { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 10px; font-size: 13px; color: #374151; }

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
  .detail-video {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: stretch;
    width: 100%;
  }
  .detail-video .detail-label {
    font-size: 12px;
    color: #6b7280;
  }
  .detail-video .detail-video-player {
    width: min(100%, 280px);
    height: 180px;
    max-width: 100%;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    cursor: pointer;
    object-fit: contain;
    background: #0f172a;
    display: block;
    margin: 0 auto;
  }
  .detail-video .detail-video-player.detail-video-player-large {
    width: 100%;
    max-width: min(100%, 960px);
    height: min(72vh, 70vw);
    min-height: 320px;
    max-height: 72vh;
    border-radius: 8px;
    cursor: default;
    object-fit: contain;
    background: #000;
  }
  .detail-image-row .detail-label {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 6px;
  }
  .detail-video-row .detail-label {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 6px;
  }
  .image-row-container {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 6px;
  }
  .image-row-thumb {
    flex: 0 0 auto;
    width: 64px;
    height: 64px;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    overflow: hidden;
    cursor: pointer;
  }
  .image-row-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .video-row-container {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 6px;
  }
  .video-row-thumb {
    flex: 0 0 auto;
    width: 112px;
    height: 84px;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    overflow: hidden;
    cursor: pointer;
    background: #0f172a;
  }
  .video-row-thumb .video-row-player {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    background: #0f172a;
  }
  .modal-form {
    display: flex;
    flex-wrap: wrap;
    gap: 16px 20px;
    padding-top: 8px;
  }
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1 1 calc(50% - 20px);
    min-width: 200px;
    .field-hint {
      margin-top: 4px;
      font-size: 11px;
      color: #f5222d;
    }
  }
  .form-group.full-width {
    flex: 1 1 100%;
  }
  .form-group label {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
  }
  .form-input, .form-select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 14px;
    transition: all 0.2s;
    box-sizing: border-box;
  }
  .form-input:focus, .form-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
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
.file-input-hidden {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}
.file-input-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.file-count { font-size: 12px; color: #6b7280; }
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
  overflow: hidden;
  background: #f8fafc;
}
.file-thumb-item .thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.file-thumb-item .thumb .file-thumb-video {
  width: 100%;
  height: 100%;
  display: block;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  object-fit: contain;
  background: #0f172a;
}
@media (max-width: 900px) {
  .detail-video .detail-video-player.detail-video-player-large {
    height: min(60vh, 56vw);
    min-height: 240px;
  }
  .video-row-thumb {
    width: 96px;
    height: 72px;
  }
}
@media (max-width: 640px) {
  .detail-video .detail-video-player {
    width: 100%;
    height: 160px;
  }
  .detail-video .detail-video-player.detail-video-player-large {
    height: min(52vh, 64vw);
    min-height: 220px;
  }
  .file-thumb-list {
    grid-template-columns: repeat(3, 1fr);
  }
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
.required-mark { color: #ef4444; margin-right: 4px; font-weight: 700; }
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
.token-input {
  min-height: 36px;
  line-height: 22px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  white-space: pre-wrap;
}
.token-input:focus {
  outline: none;
  border-color: #93c5fd;
  box-shadow: 0 0 0 2px rgba(59,130,246,0.1);
}
.token-chip {
  padding: 2px 10px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  border-radius: 12px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  line-height: 18px;
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
