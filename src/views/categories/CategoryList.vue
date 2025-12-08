<template>
  <div>
    <div class="page-title">类目管理</div>
    
    <div class="grid">
      <!-- Category Tree -->
      <div class="card" style="grid-column: span 4; min-height: 500px;">
        <div class="card-header">
          <h3>类目层级</h3>
          <button class="btn-sm primary" @click="addCategory">添加类目</button>
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
              <select class="form-select" disabled>
                <option>一级类目</option>
                <option>电子产品</option>
              </select>
            </div>
            <div class="form-group">
              <label>排序权重</label>
              <input type="number" class="form-input" v-model="activeCategory.sort">
            </div>
            <div class="form-group">
              <label>显示状态</label>
              <div class="radio-group">
                <label class="radio-label"><input type="radio" :name="'status'+activeCategory.id" checked> 显示</label>
                <label class="radio-label"><input type="radio" :name="'status'+activeCategory.id"> 隐藏</label>
              </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="form-group">
              <label>关联属性</label>
              <div class="tags-input">
                <span class="tag" v-for="(attr, idx) in activeCategory.attributes" :key="idx">
                  {{ attr }} <span class="remove" @click="activeCategory.attributes.splice(idx, 1)">×</span>
                </span>
                <button class="btn-link" @click="addAttribute">+ 添加属性</button>
              </div>
            </div>
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
import { ref, inject } from 'vue'

const showModal = inject('showModal')
const showToast = inject('showToast')
const confirmDialog = inject('confirmDialog')

const categories = ref([
  {
    id: 1,
    name: '电子产品',
    expanded: true,
    sort: 1,
    attributes: ['品牌', '型号', '上市年份'],
    children: [
      { id: 11, name: '手机通讯', sort: 1, attributes: ['屏幕尺寸', '处理器', '内存'] },
      { id: 12, name: '电脑办公', sort: 2, attributes: ['显卡', 'CPU', '硬盘容量'] },
      { id: 13, name: '数码配件', sort: 3, attributes: ['材质', '接口类型'] }
    ]
  },
  {
    id: 2,
    name: '服装服饰',
    expanded: false,
    sort: 2,
    attributes: ['材质', '风格', '适用季节'],
    children: [
      { id: 21, name: '男装', sort: 1, attributes: ['尺码', '领型'] },
      { id: 22, name: '女装', sort: 2, attributes: ['裙长', '袖长'] }
    ]
  },
  {
    id: 3,
    name: '家居生活',
    expanded: false,
    sort: 3,
    attributes: ['风格', '材质'],
    children: [
      { id: 31, name: '家纺', sort: 1, attributes: ['面料', '尺寸'] },
      { id: 32, name: '厨具', sort: 2, attributes: ['材质', '适用炉灶'] }
    ]
  }
])

const activeCategory = ref(categories.value[0].children[0])

const selectCategory = (cat) => {
  activeCategory.value = cat
}

const toggleExpand = (cat) => {
  cat.expanded = !cat.expanded
}

const addCategory = () => {
  showModal({
    title: '添加类目',
    content: `
      <div class="form-group">
        <label>类目名称</label>
        <input type="text" class="form-input" placeholder="请输入类目名称">
      </div>
      <div class="form-group">
        <label>上级类目</label>
        <select class="form-select">
          <option value="0">作为一级类目</option>
          <option value="1">电子产品</option>
          <option value="2">服装服饰</option>
        </select>
      </div>
      <div class="form-group">
        <label>排序</label>
        <input type="number" class="form-input" value="0">
      </div>
    `,
    onConfirm: () => {
      showToast('类目添加成功')
    }
  })
}

const deleteCategory = (cat) => {
  confirmDialog({
    title: '确认删除',
    content: `确定要删除类目 "${cat.name}" 吗？此操作不可恢复。`,
    onConfirm: () => {
      showToast('类目已删除')
      activeCategory.value = null
    }
  })
}

const saveCategory = () => {
  showToast('保存成功')
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
        activeCategory.value.attributes.push('新属性')
        showToast('属性已添加')
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
