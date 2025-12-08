<template>
  <header class="header">
    <button class="menu-btn" @click="$emit('toggle')">☰</button>
    <div class="brand">Shop Admin</div>
    <div class="header-spacer"></div>
    <div class="actions">
      <input class="search" type="text" placeholder="搜索" />
      <div class="avatar">A</div>
    </div>
  </header>
</template>

<script>
export default {
  name: 'LayoutHeader'
}
</script>

<style lang="scss">
.header {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  background: #ffffff;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  z-index: 10;
  position: relative;
}
.menu-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  font-size: 24px;
  cursor: pointer;
  margin-right: 16px;
  color: #4b5563;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  
  &:hover {
    background: #f3f4f6;
  }
}
.brand {
  font-weight: 800;
  font-size: 20px;
  background: linear-gradient(to right, var(--primary-color), #60a5fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
}
.header-spacer {
  flex: 1;
}
.actions {
  display: flex;
  align-items: center;
  gap: 16px;
}
.search {
  height: 40px;
  border: 1px solid #e5e7eb;
  border-radius: 99px;
  padding: 0 16px;
  width: 240px;
  font-size: 14px;
  background: #f9fafb;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    background: #fff;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color) 0%, #60a5fa 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }
}
@media (max-width: 576px) {
  .search {
    display: none;
  }
}
</style>
