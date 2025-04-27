<template>
  <div class="user-page">
    <header class="header">
      <div class="header-left">
        <!-- 点击头像跳转到用户详情页 -->
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
            <router-link to="/user/dashboard" class="menu-link">仪表盘</router-link>
          </li>
          <li class="menu-item">
            <!-- 用户信息 -->
            <div @click="toggleUserInfo" class="menu-title">
              用户信息
              <span class="arrow">{{ isUserInfoOpen ? '▼' : '▶' }}</span>
            </div>
            <!-- 用户信息子目录 -->
            <ul v-if="isUserInfoOpen" class="sub-menu">
              <li class="sub-menu-item">
                <router-link to="/user/userinfo/userlist" class="sub-menu-link">用户列表</router-link>
              </li>
              <li class="sub-menu-item2">
                <router-link to="/user/bigdatauser/userlist" class="sub-menu-link">大数据用户</router-link>
              </li>

            </ul>
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
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import defaultAvatar from '@/assets/default-avatar.png';
import { API_CONFIG } from './config';

export default {
  name: 'UserPage',
  setup() {
    const store = useStore();
    const router = useRouter();
    const isUserInfoOpen = ref(false); // 控制用户信息子目录的展开状态

    const user = computed(() => store.state.user);
    const displayName = computed(() => user.value?.username || user.value?.phone || user.value?.email || '未登录');

    // 处理头像路径
    const avatarUrl = computed(() => {
      if (user.value?.photo) {
        // 拼接完整 URL
        return `${API_CONFIG.BASE_URL}${user.value.photo}`;
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

    // 切换用户信息子目录的展开状态
    const toggleUserInfo = () => {
      isUserInfoOpen.value = !isUserInfoOpen.value;
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
      isUserInfoOpen,
      toggleUserInfo,
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

.menu-link {
  color: white;
  text-decoration: none;
  font-size: 14px; /* 仪表盘字体大小 */
}

.menu-link:hover {
  color: #1890ff;
}

.menu-title {
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px; /* 用户信息字体大小 */
}

.arrow {
  font-size: 12px;
}

.sub-menu {
  list-style: none;
  padding: 0;
  margin: 10px 0 0 20px;
}

.sub-menu-item {
  padding: 10px 0;
}

.sub-menu-link {
  color: white;
  text-decoration: none;
  font-size: 14px; /* 用户列表字体大小 */
}

.sub-menu-link:hover {
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