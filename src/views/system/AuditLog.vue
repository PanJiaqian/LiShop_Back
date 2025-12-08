<template>
  <div>
    <div class="page-title">操作日志</div>
    
    <div class="card" style="margin-bottom: 24px;">
      <div class="filter-bar">
        <input type="text" class="form-input" placeholder="操作人/IP" />
        <select class="form-select">
          <option value="">操作类型</option>
          <option value="login">登录</option>
          <option value="create">新增</option>
          <option value="update">修改</option>
          <option value="delete">删除</option>
        </select>
        <input type="date" class="form-input" />
        <span class="separator">-</span>
        <input type="date" class="form-input" />
        <button class="btn-sm primary">查询</button>
      </div>
    </div>

    <div class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>操作人</th>
            <th>操作模块</th>
            <th>操作类型</th>
            <th>操作内容</th>
            <th>IP地址</th>
            <th>操作时间</th>
            <th>结果</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id">
            <td>{{ log.id }}</td>
            <td>{{ log.user }}</td>
            <td>{{ log.module }}</td>
            <td>{{ log.type }}</td>
            <td>
              <div class="log-content" :title="log.content">{{ log.content }}</div>
            </td>
            <td>{{ log.ip }}</td>
            <td>{{ log.time }}</td>
            <td>
              <span class="badge" :class="log.result === '成功' ? 'success' : 'danger'">{{ log.result }}</span>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="pagination">
        <span class="page-info">共 1,024 条记录</span>
        <div class="page-btns">
          <button class="btn-sm" disabled>上一页</button>
          <button class="btn-sm active">1</button>
          <button class="btn-sm">2</button>
          <button class="btn-sm">3</button>
          <button class="btn-sm">...</button>
          <button class="btn-sm">10</button>
          <button class="btn-sm">下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AuditLog',
  data () {
    return {
      logs: [
        { id: 1024, user: 'admin', module: '订单管理', type: '修改', content: '修改订单 ORD-20251204-001 备注', ip: '192.168.1.10', time: '2025-12-04 11:30:25', result: '成功' },
        { id: 1023, user: 'editor01', module: '商品管理', type: '新增', content: '发布新商品 "无线降噪耳机 Pro"', ip: '192.168.1.12', time: '2025-12-04 10:15:00', result: '成功' },
        { id: 1022, user: 'admin', module: '系统管理', type: '登录', content: '用户登录', ip: '192.168.1.10', time: '2025-12-04 09:00:00', result: '成功' },
        { id: 1021, user: 'finance', module: '财务管理', type: '导出', content: '导出 2025年11月财务报表', ip: '192.168.1.20', time: '2025-12-02 16:45:30', result: '成功' },
        { id: 1020, user: 'service01', module: '订单管理', type: '查询', content: '查询订单 ORD-20251130-999', ip: '192.168.1.15', time: '2025-12-01 14:20:10', result: '成功' },
        { id: 1019, user: 'unknown', module: '系统管理', type: '登录', content: '尝试登录失败 (密码错误)', ip: '114.25.10.8', time: '2025-11-30 23:11:05', result: '失败' }
      ]
    }
  }
}
</script>

<style scoped lang="scss">
.log-content {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #666;
}
</style>
