<template>
  <div>
    <div class="page-title">Banner 管理</div>
    
    <div class="card" style="margin-bottom: 24px;">
      <div class="filter-bar">
        <select class="form-select" v-model="filter.position">
          <option value="">显示位置</option>
          <option value="home">首页轮播</option>
          <option value="category">分类页广告</option>
        </select>
        <select class="form-select" v-model="filter.status">
          <option value="">状态</option>
          <option value="active">启用</option>
          <option value="disabled">禁用</option>
        </select>
        <button class="btn-sm primary" @click="handleSearch">查询</button>
        <button class="btn-sm primary" style="margin-left: auto;" @click="addBanner">添加 Banner</button>
      </div>
    </div>

    <div class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th width="60">排序</th>
            <th width="120">缩略图</th>
            <th>标题</th>
            <th>跳转链接</th>
            <th>位置</th>
            <th>状态</th>
            <th width="150">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="banner in banners" :key="banner.id">
            <td>
              <input type="number" class="form-input sort-input" :value="banner.sort" @change="updateSort(banner, $event)" />
            </td>
            <td>
              <div class="banner-img-placeholder">
                <span>{{ banner.title.charAt(0) }}</span>
              </div>
            </td>
            <td>{{ banner.title }}</td>
            <td>
              <a :href="banner.link" target="_blank" class="link">{{ banner.link }}</a>
            </td>
            <td>{{ banner.position }}</td>
            <td>
              <label class="switch-sm">
                <input type="checkbox" :checked="banner.status === 'active'" @change="toggleStatus(banner)" />
                <span class="slider round"></span>
              </label>
            </td>
            <td>
              <div class="actions">
                <button class="btn-link" @click="editBanner(banner)">编辑</button>
                <button class="btn-link danger" @click="deleteBanner(banner)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="pagination">
        <span class="page-info">共 5 条记录</span>
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
  position: '',
  status: ''
})

const banners = ref([
  { id: 1, title: '双12大促主会场', link: '/pages/activity/1212', position: '首页轮播', sort: 1, status: 'active' },
  { id: 2, title: '新品发布会', link: '/pages/activity/new', position: '首页轮播', sort: 2, status: 'active' },
  { id: 3, title: '会员权益升级', link: '/pages/member/rights', position: '首页轮播', sort: 3, status: 'active' },
  { id: 4, title: '数码家电专场', link: '/pages/category/digital', position: '分类页广告', sort: 1, status: 'active' },
  { id: 5, title: '服饰清仓', link: '/pages/category/clothes', position: '分类页广告', sort: 2, status: 'disabled' }
])

const handleSearch = () => {
  showToast('搜索结果已更新')
}

const updateSort = (banner, event) => {
  banner.sort = parseInt(event.target.value)
  showToast('排序已更新')
}

const toggleStatus = (banner) => {
  banner.status = banner.status === 'active' ? 'disabled' : 'active'
  showToast(`Banner已${banner.status === 'active' ? '启用' : '禁用'}`)
}

const addBanner = () => {
  showModal({
    title: '添加 Banner',
    content: `
      <div class="form-group">
        <label>标题</label>
        <input type="text" class="form-input" placeholder="请输入Banner标题">
      </div>
      <div class="form-group">
        <label>跳转链接</label>
        <input type="text" class="form-input" placeholder="请输入跳转链接">
      </div>
      <div class="form-group">
        <label>显示位置</label>
        <select class="form-select">
          <option>首页轮播</option>
          <option>分类页广告</option>
        </select>
      </div>
      <div class="form-group">
        <label>图片上传</label>
        <div style="border: 2px dashed #e2e8f0; padding: 20px; text-align: center; border-radius: 6px; color: #64748b; cursor: pointer;">
          点击上传图片
        </div>
      </div>
    `,
    onConfirm: () => {
      showToast('Banner添加成功')
    }
  })
}

const editBanner = (banner) => {
  showModal({
    title: '编辑 Banner',
    content: `
      <div class="form-group">
        <label>标题</label>
        <input type="text" class="form-input" value="${banner.title}">
      </div>
      <div class="form-group">
        <label>跳转链接</label>
        <input type="text" class="form-input" value="${banner.link}">
      </div>
      <div class="form-group">
        <label>显示位置</label>
        <select class="form-select">
          <option ${banner.position === '首页轮播' ? 'selected' : ''}>首页轮播</option>
          <option ${banner.position === '分类页广告' ? 'selected' : ''}>分类页广告</option>
        </select>
      </div>
    `,
    onConfirm: () => {
      showToast('Banner修改成功')
    }
  })
}

const deleteBanner = (banner) => {
  confirmDialog({
    title: '删除 Banner',
    content: `确定要删除 Banner "${banner.title}" 吗？此操作不可恢复。`,
    onConfirm: () => {
      showToast('Banner已删除')
    }
  })
}
</script>

<style scoped lang="scss">
.banner-img-placeholder {
  width: 100px;
  height: 50px;
  background: #f1f5f9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 20px;
  font-weight: bold;
}

.link {
  color: var(--primary-color);
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}

.sort-input {
  width: 60px;
  text-align: center;
}

/* Switch Toggle Small */
.switch-sm {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 18px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #cbd5e1;
    transition: .4s;
    border-radius: 34px;
    
    &:before {
      position: absolute;
      content: "";
      height: 14px;
      width: 14px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
  }
  
  input:checked + .slider {
    background-color: var(--primary-color);
  }
  
  input:checked + .slider:before {
    transform: translateX(18px);
  }
}
</style>
