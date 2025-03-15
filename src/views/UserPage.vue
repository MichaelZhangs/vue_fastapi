<template>
  <div class="user-page">
    <header class="header">
      <div class="header-left">
        <!-- 点击头像跳转到 PersonInfo.vue -->
        <div class="user-info" @click="goToUserDetail">
          <img :src="avatarUrl" alt="头像" class="avatar" />
          <span class="username">{{ displayName }}</span>
        </div>
      </div>
      <div class="header-right">
        <button @click="logout" class="logout-button">退出登录</button>
      </div>
    </header>

    <div class="main-layout">
      <aside class="sidebar">
        <ul class="menu">
          <li class="menu-item">
            <router-link to="/user/dashboard">仪表盘</router-link>
          </li>
          <li class="menu-item">
            <router-link to="/user/profile">个人资料</router-link>
          </li>
        </ul>
      </aside>

      <main class="main-content">
        <router-view></router-view>
      </main>
    </div>
  </div>
</template>

<script>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import defaultAvatar from '@/assets/default-avatar.png';

export default {
  name: 'UserPage',
  setup() {
    const store = useStore();
    const router = useRouter();

    const user = computed(() => store.state.user);
    const displayName = computed(() => user.value?.username || user.value?.phone || user.value?.email || '未登录');

    // 处理头像路径
    const avatarUrl = computed(() => {
      if (user.value?.photo) {
        // 拼接完整 URL
        return `http://127.0.0.1:8000${user.value.photo}`;
      }
      // 如果头像为空，使用默认头像
      return defaultAvatar;
    });

    // 退出登录
    const logout = () => {
      store.dispatch('logout');
      router.push('/login');
    };

    // 跳转到用户详情页
    const goToUserDetail = () => {
      router.push('/user/detail');
    };

    // 页面加载时检查用户是否登录
    onMounted(() => {
      if (!store.state.user) {
        router.push('/login');
      }
    });

    return {
      user,
      displayName,
      avatarUrl,
      logout,
      goToUserDetail,
    };
  },
};
</script>

<style scoped>
.user-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f0f2f5;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  background-color: #001529;
  color: white;
}

.header-left {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
}

.username {
  margin-right: 20px;
  font-size: 16px;
}

.logout-button {
  padding: 5px 10px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.logout-button:hover {
  background-color: #40a9ff;
}

.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 200px;
  background-color: #001529;
  color: white;
  overflow-y: auto;
}

.menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-item {
  padding: 15px 20px;
  border-bottom: 1px solid #002140;
}

.menu-item a {
  color: white;
  text-decoration: none;
  display: block;
}

.menu-item a:hover {
  color: #1890ff;
}

.main-content {
  flex: 1;
  padding: 20px;
  background-color: white;
  overflow-y: auto;
  position: relative;
}
</style>