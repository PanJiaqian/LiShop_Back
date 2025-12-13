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
                  <span class="node-name" style="padding-left: 20px;">{{ child.name }}</span>
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
                <option value="0">一级类目</option>
                <option v-for="cat in flatCategories" :key="cat.id" :value="cat.id" v-show="cat.id !== activeCategory.id">{{ cat.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>排序</label>
              <input type="number" class="form-input" v-model="activeCategory.sort_order">
            </div>
            <div class="form-group">
              <label>状态</label>
              <div class="radio-group">
                <label class="radio-label"><input type="radio" :name="'status'+activeCategory.id" :value="1" v-model="activeCategory.status"> 上架</label>
                <label class="radio-label"><input type="radio" :name="'status'+activeCategory.id" :value="0" v-model="activeCategory.status"> 下架</label>
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
import { listCategories, createCategory, updateCategory, updateCategoryStatus } from '@/api/category'

const showModal = inject('showModal')
const showToast = inject('showToast')
const confirmDialog = inject('confirmDialog')

const categories = ref([])
const flatCategories = ref([])
const activeCategory = ref(null)

const fetchCategories = async () => {
  try {
    const res = await listCategories({ page: 1, page_size: 100, sort_by: 'sort_order', sort_order: 'asc' })
    if (res.success) {
      const items = res.data.items.map(item => ({
        ...item,
        id: item.categories_id, // Map categories_id to id
        expanded: false,
        children: [],
        attributes: item.attributes || [] // Preserve if exists, else empty
      }))
      flatCategories.value = items
      categories.value = buildTree(items)
      
      // Refresh active category if it exists
      if (activeCategory.value) {
        const found = items.find(c => c.id === activeCategory.value.id)
        if (found) {
          activeCategory.value = found
        } else {
          activeCategory.value = null
        }
      }
    }
  } catch (e) {
    showToast('获取类目列表失败')
  }
}

const buildTree = (items) => {
  const map = {}
  const roots = []
  
  // Clone items to avoid reference issues during build
  const nodes = items.map(item => ({ ...item, children: [] }))
  
  nodes.forEach(node => {
    map[node.id] = node
  })
  
  nodes.forEach(node => {
    if (node.parent_id === '0' || !map[node.parent_id]) {
      roots.push(node)
    } else {
      map[node.parent_id].children.push(node)
    }
  })
  
  return roots
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
  const options = [{ label: '一级类目', value: '0' }]
  flatCategories.value.forEach(c => {
    options.push({ label: c.name, value: c.id })
  })

  showModal({
    type: 'form',
    title: '添加类目',
    fields: {
      name: { label: '类目名称', type: 'text', value: '' },
      parent_id: { label: '上级类目', type: 'select', value: '0', options },
      sort_order: { label: '排序', type: 'number', value: '1' },
      status: { label: '状态', type: 'select', value: '1', options: [
        { label: '显示', value: '1' },
        { label: '隐藏', value: '0' }
      ]}
    },
    onConfirm: async (fields) => {
      try {
        await createCategory({
          name: fields.name.value,
          parent_id: fields.parent_id.value,
          sort_order: parseInt(fields.sort_order.value),
          status: parseInt(fields.status.value)
        })
        showToast('创建分类成功')
        await fetchCategories()
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
    onConfirm: () => {
      showToast('暂未开放删除功能')
      // activeCategory.value = null
    }
  })
}

const saveCategory = async () => {
  if (!activeCategory.value) return
  
  try {
    await updateCategory({
      category_id: activeCategory.value.id,
      name: activeCategory.value.name,
      parent_id: activeCategory.value.parent_id,
      sort_order: parseInt(activeCategory.value.sort_order)
    })
    
    await updateCategoryStatus({
      category_id: activeCategory.value.id,
      status: String(activeCategory.value.status)
    })
    
    showToast('保存成功')
    await fetchCategories()
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
</style>
