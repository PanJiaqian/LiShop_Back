<template>
  <div>
    <div class="page-title">类目管理</div>
    
    <div class="grid">
      <!-- Category Tree -->
      <div class="card" style="grid-column: span 4; min-height: 500px;">
        <div class="card-header">
          <h3>类目层级</h3>
          <button class="btn-sm primary" @click="handleAddCategory">添加类目</button>
        </div>
        <div class="category-tree">
          <div class="tree-node" v-for="category in categories" :key="category.id">
            <div class="node-content" :class="{ active: activeCategory && activeCategory.id === category.id }" @click="selectCategory(category)">
              <span class="toggle-icon" @click.stop="toggleExpand(category)">{{ category.expanded ? '▼' : '▶' }}</span>
              <span class="node-name">{{ category.name }}</span>
            </div>
            <div class="node-children" v-if="category.expanded">
              <div class="tree-node" v-for="child in category.children" :key="child.id">
                <div class="node-content" :class="{ active: activeCategory && activeCategory.id === child.id }" @click="selectCategory(child)">
                  <span class="toggle-icon" @click.stop="toggleExpand(child)">{{ child.expanded ? '▼' : '▶' }}</span>
                  <span class="node-name" style="padding-left: 20px;">{{ child.name }}</span>
                </div>
                <div class="node-children" v-if="child.expanded">
                  <div class="tree-node" v-for="grand in child.children" :key="grand.id">
                    <div class="node-content" :class="{ active: activeCategory && activeCategory.id === grand.id }" @click="selectCategory(grand)">
                      <span class="toggle-icon" @click.stop="toggleExpand(grand)">{{ grand.expanded ? '▼' : '▶' }}</span>
                      <span class="node-name" style="padding-left: 40px;">{{ grand.name }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Category Details -->
      <div class="card" style="grid-column: span 8; min-height: 500px;">
        <div v-if="activeCategory">
          <div class="card-header">
            <h3>{{ activeCategory.name }} - 详情设置</h3>
            <div class="actions">
              <button class="btn-sm danger" @click="deleteCategory(activeCategory)">删除</button>
              <button class="btn-sm primary" @click="saveCategory">保存更改</button>
            </div>
          </div>
          
          <div class="form-section">
            <div class="form-group">
              <label>类目名称</label>
              <input type="text" class="form-input" v-model="activeCategory.name">
            </div>
            <div class="form-group">
              <label>上级类目</label>
              <select class="form-select" v-model="activeCategory.parent_id">
                <option value="无">一级类目</option>
                <option v-for="cat in flatCategories" :key="cat.id" :value="cat.name" v-show="cat.name !== activeCategory.name">{{ cat.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>推荐值</label>
              <input type="number" class="form-input" v-model="activeCategory.sort_order">
            </div>
            <div class="form-group">
              <label>状态</label>
              <div class="radio-group">
                <label class="radio-label"><input type="radio" :name="'status'+activeCategory.id" :value="1" v-model="activeCategory.status"> 上架</label>
                <label class="radio-label"><input type="radio" :name="'status'+activeCategory.id" :value="0" v-model="activeCategory.status"> 下架</label>
              </div>
            </div>
            <div class="form-group">
              <label>分类图片</label>
              <div style="display: flex; align-items: center; gap: 12px;">
                <div v-if="normalizeImageUrl(activeCategory.image_url)" class="product-thumb">
                  <img :src="normalizeImageUrl(activeCategory.image_url)" @error="onImgError($event)" alt="category" @click="previewCategoryImage(normalizeImageUrl(activeCategory.image_url))"
                    style="cursor: pointer; width: 64px; height: 64px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb;" />
                  <span class="thumb-remove" @click="deleteCategoryImage">&times;</span>
                </div>
                <input type="file" ref="catImageRef" accept="image/*" @change="onSelectCategoryImage" style="display: none;" />
                <div class="file-input-actions" v-if="!normalizeImageUrl(activeCategory.image_url)">
                  <button class="btn-sm" @click="openCatImageChooser">选择文件</button>
                  <span v-if="selectedCatImage" class="file-count">已选择 1 个</span>
                  <button class="btn-sm primary" @click="uploadSelectedCategoryImage" :disabled="!selectedCatImage">上传</button>
                </div>
              </div>
            </div>
            
            <div class="divider"></div>
            
            <!-- <div class="form-group">
              <label>关联属性</label>
              <div class="tags-input">
                <span class="tag" v-for="(attr, idx) in activeCategory.attributes" :key="idx">
                  {{ attr }} <span class="remove" @click="activeCategory.attributes.splice(idx, 1)">×</span>
                </span>
                <button class="btn-link" @click="addAttribute">+ 添加属性</button>
              </div>
            </div> -->
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="icon">←</div>
          <p>请选择左侧类目查看详情</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted, computed } from 'vue'
import { listCategories, createCategory, updateCategory, updateCategoryStatus, deleteCategory as deleteCategoryApi, uploadCategoryImage } from '@/api/category'
import { deleteProductFile } from '@/api/product'

const showModal = inject('showModal')
const showToast = inject('showToast')
const confirmDialog = inject('confirmDialog')

const categories = ref([])
const flatCategories = ref([])
const activeCategory = ref(null)

const fetchCategories = async () => {
  try {
    const res = await listCategories({ page: 1, page_size: 100, sort_by: 'sort_order', sort_order: 'asc' })
    if (res && res.success) {
      const items = res.data.items.map(item => ({
        ...item,
        id: item.categories_id,
        expanded: false,
        children: [],
        attributes: item.attributes || []
      }))
      flatCategories.value = items
      categories.value = buildTree(items)
      sortTree(categories.value)
      
      if (activeCategory.value) {
        const found = items.find(c => c.id === activeCategory.value.id)
        if (found) {
          activeCategory.value = found
        } else {
          activeCategory.value = null
        }
      }
    } else {
      flatCategories.value = []
      categories.value = []
      const msg = (res && (res.data || res.message)) || '获取类目列表失败'
      showToast(String(msg))
    }
  } catch (e) {
    showToast('获取类目列表失败')
  }
}

// Resolve the value selected in UI to an ID string for API submission
const resolveParentId = (val) => {
  if (!val || val === '无') return '0'
  // If already looks like an id, pass through
  if (typeof val === 'string' && /^cat\d+/.test(val)) return val
  const found = (flatCategories.value || []).find(c => c.name === val)
  return found ? (found.id || '0') : '0'
}

const buildTree = (items) => {
  const mapByName = {}
  const roots = []
  
  const nodes = items.map(item => ({ ...item, children: [] }))
  
  nodes.forEach(node => {
    mapByName[node.name] = node
  })
  
  nodes.forEach(node => {
    if (node.parent_id === '无' || !node.parent_id || !mapByName[node.parent_id]) {
      roots.push(node)
    } else {
      mapByName[node.parent_id].children.push(node)
    }
  })
  
  return roots
}

const sortTree = (nodes) => {
  if (!Array.isArray(nodes)) return
  nodes.sort((a, b) => (parseInt(b.sort_order || 0) - parseInt(a.sort_order || 0)))
  nodes.forEach(n => sortTree(n.children))
}

onMounted(() => {
  fetchCategories()
})

const selectCategory = (cat) => {
  activeCategory.value = cat
}

const toggleExpand = (cat) => {
  cat.expanded = !cat.expanded
}

const handleAddCategory = () => {
  const options = [{ label: '一级类目', value: '无' }]
  const pushOpts = (nodes, prefix) => {
    (nodes || []).forEach(n => {
      options.push({ label: `${prefix}${n.name}`, value: n.name })
      if (Array.isArray(n.children) && n.children.length) {
        pushOpts(n.children, `${prefix}— `)
      }
    })
  }
  pushOpts(categories.value || [], '')

  showModal({
    type: 'form',
    title: '添加类目',
    fields: {
      name: { label: '类目名称', type: 'text', value: '' },
      parent_id: { label: '上级类目', type: 'select', value: '无', options },
      sort_order: { label: '推荐值', type: 'number', value: '1' },
      status: { label: '状态', type: 'select', value: '1', options: [
        { label: '显示', value: '1' },
        { label: '隐藏', value: '0' }
      ]}
    },
    onConfirm: async (fields) => {
      try {
        const res = await createCategory({
          name: fields.name.value,
          parent_id: resolveParentId(fields.parent_id.value),
          sort_order: parseInt(fields.sort_order.value),
          status: parseInt(fields.status.value)
        })
        if (res && res.success) {
          showToast('创建分类成功')
          await fetchCategories()
        } else {
          const msg = (res && (res.data || res.message)) || '创建分类失败'
          showToast(String(msg))
        }
      } catch (e) {
        showToast('创建分类失败')
      }
    }
  })
}

const deleteCategory = (cat) => {
  confirmDialog({
    title: '确认删除',
    content: `确定要删除类目 "${cat.name}" 吗？此操作不可恢复。`,
    onConfirm: async () => {
      try {
        const fd = new FormData()
        fd.append('category_id', cat.id)
        const res = await deleteCategoryApi(fd)
        if (res && res.success) {
          const msg = (res && res.message) || '删除分类成功'
          showToast(msg)
          activeCategory.value = null
          await fetchCategories()
        } else {
          const msg = (res && (res.data || res.message)) || '删除分类失败'
          showToast(String(msg))
        }
      } catch (e) {
        showToast('删除分类失败')
      }
    }
  })
}

const saveCategory = async () => {
  if (!activeCategory.value) return
  
  try {
    const res1 = await updateCategory({
      category_id: activeCategory.value.id,
      name: activeCategory.value.name,
      parent_id: resolveParentId(activeCategory.value.parent_id),
      sort_order: parseInt(activeCategory.value.sort_order)
    })
    const res2 = await updateCategoryStatus({
      category_id: activeCategory.value.id,
      status: String(activeCategory.value.status)
    })
    if ((res1 && res1.success) && (res2 && res2.success)) {
      showToast('保存成功')
      await fetchCategories()
    } else {
      const msg = (!res1?.success ? (res1?.data || res1?.message) : (!res2?.success ? (res2?.data || res2?.message) : '保存失败'))
      showToast(String(msg))
    }
  } catch (e) {
    showToast('保存失败')
  }
}

const addAttribute = () => {
  showModal({
    title: '添加关联属性',
    content: `
      <div class="form-group">
        <label>属性名称</label>
        <input type="text" class="form-input" placeholder="如：颜色、尺寸">
      </div>
      <div class="form-group">
        <label>属性类型</label>
        <select class="form-select">
          <option>单选</option>
          <option>多选</option>
          <option>文本输入</option>
        </select>
      </div>
    `,
    onConfirm: () => {
      if (activeCategory.value) {
        if (!activeCategory.value.attributes) activeCategory.value.attributes = []
        activeCategory.value.attributes.push('新属性')
        showToast('属性已添加 (仅本地演示)')
      }
    }
  })
}

const normalizeImageUrl = (u) => {
  try { return String(u || '').replace(/^`+|`+$/g, '').trim() } catch (e) { return String(u || '') }
}
const catImageRef = ref(null)
const selectedCatImage = ref(null)
const openCatImageChooser = () => {
  try { catImageRef.value && catImageRef.value.click() } catch (e) {}
}
const onSelectCategoryImage = (e) => {
  try {
    const f = (e?.target?.files && e.target.files[0]) ? e.target.files[0] : null
    selectedCatImage.value = f || null
    if (e && e.target) { try { e.target.value = '' } catch (err) {} }
  } catch (err) { selectedCatImage.value = null }
}
const uploadSelectedCategoryImage = async () => {
  if (!activeCategory.value || !activeCategory.value.id) {
    showToast('请选择分类')
    return
  }
  if (!selectedCatImage.value) {
    showToast('请先选择图片')
    return
  }
  const fd = new FormData()
  fd.append('category_id', activeCategory.value.id)
  fd.append('image', selectedCatImage.value)
  try {
    const res = await uploadCategoryImage(fd)
    if (res && res.success) {
      showToast(res.message || '上传成功')
      selectedCatImage.value = null
      await fetchCategories()
    } else {
      const msg = (res && (res.data || res.message)) || '上传失败'
      showToast(String(msg))
    }
  } catch (e) {
    showToast('上传失败')
  }
}
const onImgError = (e) => {
  try { e.target.style.visibility = 'hidden' } catch (err) {}
}
const previewCategoryImage = (url) => {
  if (!url) return
  showModal({ type: 'detail', title: '图片预览', data: [{ label: '', value: url, type: 'image' }] })
}
const deleteCategoryImage = async () => {
  const url = normalizeImageUrl(activeCategory.value?.image_url || '')
  if (!url) return
  const fd = new FormData()
  fd.append('product_id', activeCategory.value.id)
  fd.append('file_name', url)
  fd.append('file_type', 'images')
  try {
    const res = await deleteProductFile(fd)
    if (res && res.success) {
      showToast(res.message || '删除成功')
      if (activeCategory.value) activeCategory.value.image_url = ''
      await fetchCategories()
    } else {
      const msg = (res && (res.data || res.message)) || '删除失败'
      showToast(String(msg))
    }
  } catch (e) {
    showToast('删除失败')
  }
}
</script>

<style scoped lang="scss">
.category-tree {
  .tree-node {
    .node-content {
      display: flex;
      align-items: center;
      padding: 10px 12px;
      cursor: pointer;
      border-radius: 4px;
      transition: background 0.2s;
      
      &:hover {
        background: #f5f7fa;
      }
      
      &.active {
        background: #e6f7ff;
        color: var(--primary-color);
        
        .toggle-icon {
          color: var(--primary-color);
        }
      }
    }
    
    .toggle-icon {
      width: 20px;
      display: flex;
      justify-content: center;
      color: #999;
      font-size: 12px;
      margin-right: 4px;
      
      &:hover {
        color: #666;
      }
    }
    
    .node-children {
      padding-left: 20px;
    }
  }
}

.form-section {
  max-width: 600px;
}

.form-group {
  margin-bottom: 20px;
  
  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #333;
  }
}

.radio-group {
  display: flex;
  gap: 20px;
  
  .radio-label {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }
}

.tags-input {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  min-height: 42px;
  
  .tag {
    background: #f3f4f6;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
    
    .remove {
      cursor: pointer;
      color: #999;
      &:hover { color: #ff4d4f; }
    }
  }
}

.divider {
  height: 1px;
  background: #f0f0f0;
  margin: 24px 0;
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  
  .icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
}
.product-thumb {
  position: relative;
  display: inline-block;
}
.product-thumb .thumb-remove {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  background: #ef4444;
  color: #fff;
  border-radius: 50%;
  cursor: pointer;
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.product-thumb .thumb-remove:hover {
  background: #dc2626;
}
</style>
