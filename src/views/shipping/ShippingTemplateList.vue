<template>
  <div>
    <div class="page-title">运费模板管理</div>
    
    <div class="card" style="margin-bottom: 24px;">
      <div class="filter-bar">
        <input type="text" class="form-input" placeholder="模板名称" v-model="filter.name" />
        <button class="btn-sm primary" @click="handleSearch">查询</button>
        <button class="btn-sm primary" style="margin-left: auto;" @click="createTemplate">新建模板</button>
      </div>
    </div>

    <div class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>模板名称</th>
            <th>计费方式</th>
            <th>默认运费</th>
            <th>使用情况</th>
            <th>最后编辑时间</th>
            <th width="150">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="template in templates" :key="template.id">
            <td>{{ template.name }}</td>
            <td>{{ template.type }}</td>
            <td>
              {{ template.defaultRule }}
            </td>
            <td>{{ template.usageCount }} 个商品使用</td>
            <td>{{ template.lastModified }}</td>
            <td>
              <div class="actions">
                <button class="btn-link" @click="editTemplate(template)">编辑</button>
                <button class="btn-link" @click="copyTemplate(template)">复制</button>
                <button class="btn-link danger" @click="deleteTemplate(template)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="pagination">
        <span class="page-info">共 3 条记录</span>
        <div class="page-btns">
          <button class="btn-sm" disabled>上一页</button>
          <button class="btn-sm active">1</button>
          <button class="btn-sm">下一页</button>
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

const filter = ref({
  name: ''
})

const templates = ref([
  { id: 1, name: '全国包邮', type: '按件数', defaultRule: '0元 (包邮)', usageCount: 128, lastModified: '2025-12-01 10:00:00' },
  { id: 2, name: '普通快递（按重量）', type: '按重量', defaultRule: '首重1kg: 10元, 续重1kg: 5元', usageCount: 45, lastModified: '2025-11-15 14:30:00' },
  { id: 3, name: '偏远地区加收', type: '按件数', defaultRule: '首件: 15元, 续件: 8元', usageCount: 12, lastModified: '2025-10-20 09:15:00' }
])

const handleSearch = () => {
  showToast('搜索结果已更新')
}

const createTemplate = () => {
  showModal({
    title: '新建运费模板',
    content: `
      <div class="form-group">
        <label>模板名称</label>
        <input type="text" class="form-input" placeholder="请输入模板名称">
      </div>
      <div class="form-group">
        <label>计费方式</label>
        <div class="radio-group">
          <label class="radio-label"><input type="radio" name="type" checked> 按件数</label>
          <label class="radio-label"><input type="radio" name="type"> 按重量</label>
          <label class="radio-label"><input type="radio" name="type"> 按体积</label>
        </div>
      </div>
      <div class="form-group">
        <label>默认运费</label>
        <div style="display: flex; gap: 10px; align-items: center;">
          <input type="number" class="form-input" style="width: 80px" value="1">
          <span>件内，运费</span>
          <input type="number" class="form-input" style="width: 80px" value="0">
          <span>元，每增加</span>
          <input type="number" class="form-input" style="width: 80px" value="1">
          <span>件，增加运费</span>
          <input type="number" class="form-input" style="width: 80px" value="0">
          <span>元</span>
        </div>
      </div>
    `,
    width: '600px',
    onConfirm: () => {
      showToast('运费模板创建成功')
    }
  })
}

const editTemplate = (template) => {
  showModal({
    title: '编辑运费模板',
    content: `
      <div class="form-group">
        <label>模板名称</label>
        <input type="text" class="form-input" value="${template.name}">
      </div>
      <div class="form-group">
        <label>计费方式</label>
        <div class="radio-group">
          <label class="radio-label"><input type="radio" name="type" ${template.type === '按件数' ? 'checked' : ''}> 按件数</label>
          <label class="radio-label"><input type="radio" name="type" ${template.type === '按重量' ? 'checked' : ''}> 按重量</label>
          <label class="radio-label"><input type="radio" name="type" ${template.type === '按体积' ? 'checked' : ''}> 按体积</label>
        </div>
      </div>
    `,
    width: '600px',
    onConfirm: () => {
      showToast('运费模板修改成功')
    }
  })
}

const copyTemplate = (template) => {
  confirmDialog({
    title: '复制模板',
    content: `确定要复制模板 "${template.name}" 吗？`,
    onConfirm: () => {
      showToast('模板已复制')
    }
  })
}

const deleteTemplate = (template) => {
  confirmDialog({
    title: '删除模板',
    content: `确定要删除模板 "${template.name}" 吗？如果有商品正在使用此模板，将无法删除。`,
    onConfirm: () => {
      if (template.usageCount > 0) {
        showToast('删除失败：该模板正在被商品使用')
      } else {
        showToast('模板已删除')
      }
    }
  })
}
</script>

<style scoped lang="scss">
/* Reuse global styles via AdminLayout */
.radio-group {
  display: flex;
  gap: 20px;
  padding-top: 8px;
}
.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
</style>
