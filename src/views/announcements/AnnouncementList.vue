<template>
  <div>
    <div class="page-title">
      <span>公告列表</span>
      <div class="actions">
        <button class="btn-sm primary" @click="openAnnouncementCreate">发布公告</button>
      </div>
    </div>


    <div class="card">
      <!-- <div class="card-header">
        <h3>公告列表</h3>
        <div style="display:flex; gap:8px;">
          <button class="btn-sm" @click="openAnnouncementList">刷新</button>
        </div>
      </div> -->
      <table class="data-table">
        <thead>
          <tr>
            <th>公告ID</th>
            <th>标题</th>
            <th>内容</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作人ID</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ann in announcements" :key="ann.announcement_id || ann.id">
            <td>{{ ann.announcement_id || ann.id }}</td>
            <td>{{ ann.title }}</td>
            <td class="content-col">{{ ann.content }}</td>
            <td>
              <span class="badge" :class="String(ann.status) === '1' ? 'success' : 'gray'">{{
                String(ann.status) === '1' ? '启用':'停用' }}</span>
            </td>
            <td>{{ ann.created_at }}</td>
            <td>{{ ann.last_operator_id }}</td>
            <td>
              <div class="actions">
                <button class="btn-link" @click="editAnnouncement(ann)">编辑</button>
                <button class="btn-link danger" @click="removeAnnouncement(ann)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="pagination">
        <span class="page-info">共 {{ total }} 条记录</span>
        <div class="page-btns">
          <button class="btn-sm" disabled>上一页</button>
          <button class="btn-sm active">1</button>
          <button class="btn-sm" disabled>下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { inject, ref, onMounted } from 'vue'
import { createAnnouncement, updateAnnouncement, updateAnnouncementStatus, listAnnouncements, deleteAnnouncement } from '@/api/announcement'

export default {
  name: 'AnnouncementList',
  setup() {
    const showToast = inject('showToast')
    const showModal = inject('showModal')
    const announcements = ref([])
    const total = ref(0)

    const openAnnouncementCreate = () => {
      showModal({
        type: 'form',
        title: '发布公告',
        fields: {
          title: { label: '标题', type: 'text', value: '' },
          content: { label: '内容', type: 'textarea', value: '' },
          status: { label: '状态', type: 'select', options: [{ value: 1, label: '启用' }, { value: 0, label: '停用' }], value: 1 }
        },
        onConfirm: async (fields) => {
          try {
            const res = await createAnnouncement({
              title: fields.title.value,
              content: fields.content.value,
              status: Number(fields.status.value)
            })
            if (res && res.success) {
              showToast(res.message || '发布公告成功')
              openAnnouncementList()
            } else {
              showToast('发布公告失败')
            }
          } catch (e) {
            showToast('请求失败')
          }
        }
      })
    }

    const editAnnouncement = (ann) => {
      showModal({
        type: 'form',
        title: '编辑公告',
        fields: {
          announcement_id: { label: '公告ID', type: 'text', value: ann.announcement_id || ann.id, disabled: true },
          title: { label: '标题', type: 'text', value: ann.title },
          status: { label: '状态', type: 'select', options: [{ value: 1, label: '启用' }, { value: 0, label: '停用' }], value: ann.status }
        },
        onConfirm: async (fields) => {
          try {
            // Update status explicitly as requested
            const statusRes = await updateAnnouncementStatus({
              announcement_id: fields.announcement_id.value,
              status: Number(fields.status.value)
            })

            // Update other fields
            const payload = {
              announcement_id: fields.announcement_id.value,
              title: fields.title.value
            }
            const res = await updateAnnouncement(payload)

            if ((res && res.success) || (statusRes && statusRes.success)) {
              showToast('更新公告成功')
              openAnnouncementList()
            } else {
              showToast('更新失败')
            }
          } catch (e) {
            showToast('请求失败')
          }
        }
      })
    }

    const removeAnnouncement = (ann) => {
      showModal({
        type: 'confirm',
        title: '删除公告',
        message: '确定删除该公告吗？',
        onConfirm: async () => {
          try {
            const fd = new FormData()
            fd.append('announcement_id', ann.announcement_id || ann.id)
            const res = await deleteAnnouncement(fd)
            const msg = (res && res.message) || '删除成功'
            showToast(msg)
            await openAnnouncementList()
          } catch (e) {
            showToast('删除失败')
          }
        }
      })
    }

    const openAnnouncementList = async () => {
      try {
        const res = await listAnnouncements({ page: 1, page_size: 20 })
        if (res && res.success) {
          const items = (res.data && res.data.items) || res.items || []
          announcements.value = items
          total.value = (res.data && res.data.total) || res.total || items.length
        } else {
          showToast('获取公告列表失败')
        }
      } catch (e) {
        showToast('请求失败')
      }
    }

    onMounted(() => {
      openAnnouncementList()
    })

    return {
      openAnnouncementCreate,
      openAnnouncementList,
      editAnnouncement,
      removeAnnouncement,
      announcements,
      total
    }
  }
}
</script>

<style scoped>
.page-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  font-size: 24px;
  font-weight: bold;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  background: #fff;
  cursor: pointer;
}

.btn.secondary:hover {
  background: #f9fafb;
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.data-table th {
  background: #f9fafb;
  padding: 12px 16px;
  text-align: center;
  font-weight: 500;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
}

.data-table td {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
  text-align: center;
  white-space: nowrap;
}

.data-table tr:hover td {
  background-color: #f9fafb;
}

.data-table td.content-col {
  white-space: normal;
  max-width: 300px;
  text-align: left;
}

.badge.success {
  background: #dcfce7;
  color: #166534;
  /* border: 1px solid #bbf7d0; */
  padding: 2px 8px;
  border-radius: 99px;
}

.badge.gray {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  padding: 2px 8px;
  border-radius: 4px;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-link {
  padding: 0;
  border: none;
  background: none;
  color: #3b82f6;
  cursor: pointer;
  font-size: 14px;
}

.btn-link:hover {
  text-decoration: underline;
}
</style>
