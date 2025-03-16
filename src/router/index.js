import { createRouter, createWebHistory } from "vue-router";
import UserLogin from "@/components/UserLogin.vue";
import UserPage from "@/views/UserPage.vue"; // 用户页面
import UserDashboard from "@/views/UserDashboard.vue";
import UserInfo from "@/views/UserInfo.vue";
import PasswordLogin from "@/views/PasswordLogin.vue";
import UserRegister from "@/views/UserRegister.vue";
import ForgetPassword from "@/views/ForgetPassword.vue";
import UserDetail from '@/views/UserDetail.vue'; // 新增详情页
import UserList from '@/views/UserList.vue'; // 新增用户列表页

const routes = [
  {
    path: "/",
    redirect: "/login", // 默认重定向到登录页
  },
  {
    path: "/login",
    name: "Login",
    component: UserLogin,
  },
  {
    path: "/password-login",
    component: PasswordLogin,
  },
  {
    path: "/register",
    component: UserRegister,
  },
  {
    path: '/forgot-password',
    name: 'ForgetPassword',
    component: ForgetPassword
  },
  {
    path: "/user",
    name: "User",
    component: UserPage,
    children: [
      {
        path: "dashboard",
        component: UserDashboard,
      },
      {
        path: "userinfo",
        component: UserInfo,
        children: [
          {
            path: "userlist", // 用户列表作为用户信息的子路由
            component: UserList,
          },
        ],
      },
    ],
  },
  {
    path: '/user/detail', // 新增详情页路由
    name: 'UserDetail',
    component: UserDetail,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 全局前置守卫
router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem("token"); // 假设登录后会将 token 存入 localStorage
  if (to.meta.requiresAuth && !isLoggedIn) {
    next("/login"); // 未登录则跳转到登录页
  } else {
    next(); // 已登录则继续
  }
});

export default router;