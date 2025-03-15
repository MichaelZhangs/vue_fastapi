import { createStore } from 'vuex';

// 从 localStorage 中恢复 Token 和用户信息
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));

export default createStore({
  state: {
    user: user || null, // 存储用户信息
    token: token || null, // 存储 Token，初始化时从 localStorage 中恢复
  },
  mutations: {
    // 设置用户信息
    setUser(state, user) {
      state.user = user;
      localStorage.setItem("user", JSON.stringify(user)); // 将用户信息存储到 localStorage
    },
    // 设置 Token
    setToken(state, token) {
      state.token = token;
      localStorage.setItem("token", token); // 将 Token 存储到 localStorage
    },
    // 清除用户信息
    clearUser(state) {
      state.user = null;
      localStorage.removeItem("user"); // 清除 localStorage 中的用户信息
    },
    // 清除 Token
    clearToken(state) {
      state.token = null;
      localStorage.removeItem("token"); // 清除 localStorage 中的 Token
    },
    // 更新用户信息
    updateUser(state, user) {
      state.user = { ...state.user, ...user }; // 合并用户信息
      localStorage.setItem("user", JSON.stringify(state.user)); // 更新 localStorage
    }
  },
  actions: {
    // 登录
    login({ commit }, { user, token }) {
      commit('setUser', user);
      commit('setToken', token);
    },
    // 退出登录
    logout({ commit }) {
      commit('clearUser');
      commit('clearToken');
    },
    // 更新用户信息
    updateUser({ commit }, user) {
      commit('updateUser', user);
    }
  },
  getters: {
    // 获取用户信息
    user: (state) => state.user,
    // 获取 Token
    token: (state) => state.token,
  },
});