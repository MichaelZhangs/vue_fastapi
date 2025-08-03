import axios from 'axios';
import { API_CONFIG } from '@/config/config';
import { ElMessage } from 'element-plus';

// 辅助函数：规范化ID - 区分群聊和单聊
function normalizeId(id, isGroup = false) {
  if (typeof id === 'undefined' || id === null) {
    console.error('normalizeId 错误：ID为undefined或null');
    return null;
  }
  
  // 群聊ID处理
  if (isGroup) {
    // 如果是数字，转为字符串并添加group_前缀
    if (typeof id === 'number') {
      return `group_${id}`;
    }
    
    // 如果是字符串但不是以group_开头，添加前缀
    if (typeof id === 'string' && !id.startsWith('group_')) {
      console.error(`群聊ID必须以group_开头，原ID: ${id}`);
      return `group_${id}`;
    }
    
    // 其他情况保持原样
    return String(id);
  }
  
  // 单聊ID处理 - 确保为数字类型
  if (typeof id === 'number') {
    return id;
  }
  
  // 尝试将字符串转为数字
  const numericId = Number(id);
  if (!isNaN(numericId)) {
    return numericId;
  }
  
  // 如果无法转为数字，保持字符串（但这种情况应该不会发生在单聊中）
  console.warn(`单聊ID无法转换为数字，使用原始值: ${id}`);
  return id;
}

// 辅助函数：从对象中提取并规范化ID
function extractAndNormalizeId(obj) {
  if (!obj) return null;
  
  // 优先使用normalizedId
  if (obj.normalizedId) {
    return obj.normalizedId;
  }
  
  // 尝试从多个可能的字段获取ID
  const id = obj.id || obj.group_id || obj.target_id;
  
  // 判断是否是群聊
  const isGroup = obj.isGroup === true || obj.is_group === true;
  
  return normalizeId(id, isGroup);
}

export const chatModule = {
  namespaced: true,
  state: {
    recentChats: [],    // 所有最近聊天（按时间排序）
    recentGroups: [],   // 最近群聊
    recentUsers: [],    // 最近单聊
    joinedGroups: []    // 已加入的群聊列表
  },
  mutations: {
    // 添加或更新最近聊天（自动区分群聊和单聊）
   ADD_RECENT_CHAT(state, chat) {
  const isGroup = chat.isGroup === true;
  const chatId = (isGroup ? chat.target_id || chat.group_id || chat.id : chat.user_id || chat.id)?.toString();
  
  if (!chatId) return;

  const targetList = isGroup ? state.recentGroups : state.recentUsers;
  const existingIndex = targetList.findIndex(item => item.id.toString() === chatId);

  // 优先从 joinedGroups 获取完整信息
  let mergedChat = { ...chat, id: chatId };
  if (isGroup) {
    const joinedGroup = state.joinedGroups.find(g => g.id.toString() === chatId);
    if (joinedGroup) {
      mergedChat = {
        ...joinedGroup,
        ...mergedChat,
        members_count: mergedChat.members_count ?? joinedGroup.members_count, // 确保合并
        members: mergedChat.members || joinedGroup.members || []
      };
    }
  }

  // 更新或添加记录
  if (existingIndex !== -1) {
    targetList[existingIndex] = {
      ...targetList[existingIndex],
      ...mergedChat,
      members_count: mergedChat.members_count ?? targetList[existingIndex].members_count,
      members: mergedChat.members || targetList[existingIndex].members || []
    };
  } else {
    targetList.unshift(mergedChat);
  }

  updateCombinedChats(state);
},
    
    // 初始化最近聊天
    INIT_RECENT_CHATS(state, chats) {
      const normalizedChats = chats.map(chat => {
        const normalizedId = extractAndNormalizeId(chat);
        return {
          ...chat,
          id: normalizedId,
          normalizedId // 添加规范化后的ID
        };
      });
      
      const groups = normalizedChats.filter(chat => chat.isGroup === true);
      const users = normalizedChats.filter(chat => chat.isGroup !== true);
      
      state.recentGroups = groups;
      state.recentUsers = users;
      
      updateCombinedChats(state);
    },
    
    // 初始化已加入的群聊
    INIT_JOINED_GROUPS(state, groups) {
      console.log("初始化群组数据:", groups);
      state.joinedGroups = (groups || []).map(group => {
        const normalizedId = extractAndNormalizeId(group);
        
        return {
          ...group,
          id: normalizedId,
          normalizedId, // 添加规范化后的ID
          target_id: normalizedId,
          isGroup: true,
          members: Array.isArray(group.members) ? [...new Set(group.members)] : [],
          membersCount: group.membersCount
        };
      });
      
      console.log("处理后的群组数据:", state.joinedGroups);
    },
    
    // 更新单个群聊信息（不自动添加到最近聊天）
    UPDATE_JOINED_GROUP(state, updatedGroup) {
      const normalizedId = extractAndNormalizeId(updatedGroup);
      const index = state.joinedGroups.findIndex(g => extractAndNormalizeId(g) === normalizedId);
      
      if (index !== -1) {
        state.joinedGroups.splice(index, 1, { 
          ...state.joinedGroups[index], 
          ...updatedGroup,
          id: normalizedId,
          normalizedId // 确保有规范化的ID
        });
      } else {
        state.joinedGroups.push({ 
          ...updatedGroup, 
          id: normalizedId, 
          isGroup: true,
          normalizedId // 确保有规范化的ID
        });
      }
    },
    
    // 更新未读计数
    UPDATE_UNREAD_COUNT(state, { targetId, count }) {
      // 先判断是否为群聊ID（字符串且以group_开头）
      const isGroup = typeof targetId === 'string' && targetId.startsWith('group_');
      const normalizedId = normalizeId(targetId, isGroup);
      
      // 更新最近聊天列表
      const updateChatList = (list) => {
        const index = list.findIndex(item => extractAndNormalizeId(item) === normalizedId);
        if (index !== -1) {
          list[index].unreadCount = count;
        }
      };
      
      updateChatList(state.recentGroups);
      updateChatList(state.recentUsers);
      
      // 更新已加入的群聊列表
      const groupIndex = state.joinedGroups.findIndex(g => extractAndNormalizeId(g) === normalizedId);
      if (groupIndex !== -1) {
        state.joinedGroups[groupIndex].unreadCount = count;
      }
    },
    
    // 清除所有聊天记录
    CLEAR_ALL_CHATS(state) {
      state.recentChats = [];
      state.recentGroups = [];
      state.recentUsers = [];
      state.joinedGroups = [];
    }
  },
  actions: {
    // 获取群头像
    async fetchGroupAvatar({ rootState }, groupId) {
      try {
        const normalizedId = extractAndNormalizeId({ id: groupId, isGroup: true });
        const response = await axios.get(`${API_CONFIG.BASE_URL}/group/get-group-avatar/${normalizedId}`, {
          headers: { Authorization: `Bearer ${rootState.token}` }
        });
        return response.data || [];
      } catch (error) {
        console.error('获取群头像失败:', error);
        return [];
      }
    },

    // 加载最近聊天列表
    async loadRecentChats({ commit, dispatch, rootState }) {
      try {
        const userId = rootState.user.id;
        const response = await axios.get(`${API_CONFIG.BASE_URL}/ws/chat/recent-chats/${userId}`, {
          headers: { Authorization: `Bearer ${rootState.token}` }
        });
        
        // 并行获取所有群聊的头像
        const chatsWithAvatars = await Promise.all(
          (response.data || []).map(async chat => {
            if (!chat.is_group) return chat;
            
            // 从多个可能的字段获取群ID
            const groupId = extractAndNormalizeId({ ...chat, isGroup: true });
            const avatarMembers = await dispatch('fetchGroupAvatar', groupId);
            
            return {
              ...chat,
              avatarMembers,
              normalizedId: groupId
            };
          })
        );
        
        const formattedChats = chatsWithAvatars.map(chat => {
          const normalizedId = extractAndNormalizeId(chat);
          
          return {
            id: normalizedId,
            normalizedId, // 添加规范化后的ID
            username: chat.target_username || chat.group_name,
            photo: chat.target_photo,
            lastMessage: chat.last_message,
            lastMessageTime: chat.last_message_time,
            unreadCount: chat.unread_count || 0,
            isGroup: chat.is_group || false,
            members_count: chat?.members_count || 0,
            group_members: chat?.group_members || [],
            group_owner_id: chat?.group_owner_id,
            avatar_members: chat.avatarMembers || []
          };
        });
        
        console.log("chat的值： ", chatsWithAvatars)
        commit('INIT_RECENT_CHATS', formattedChats);
        return formattedChats;
      } catch (error) {
        console.error('加载最近聊天列表失败:', error);
        return [];
      }
    },

    // 加载已加入的群聊
    async loadJoinedGroups({ commit, dispatch, rootState }) {
      try {
        if (!rootState.user?.id) {
          console.log('用户未登录，无法加载已加入的群聊');
          return [];
        }
        
        const response = await axios.get(
          `${API_CONFIG.BASE_URL}/group/get-joined-groups/${rootState.user.id}`,
          { headers: { Authorization: `Bearer ${rootState.token}` } }
        );
        
        // 并行获取所有群的头像
        const groupsWithAvatars = await Promise.all(
          (response.data || []).map(async group => {
            // 从多个可能的字段获取群ID
            const groupId = extractAndNormalizeId({ ...group, isGroup: true });
            const avatarMembers = await dispatch('fetchGroupAvatar', groupId);
            
            return {
              id: groupId,
              normalizedId: groupId, // 添加规范化后的ID
              username: group.name || '未命名群聊',
              photo: group.photo || null,
              target_id: groupId,
              created_at: group.created_at || new Date().toISOString(),
              unreadCount: group.unread_count || 0,
              members: group.members || [],
              membersCount: group.members_count || (group.members?.length || 0),
              ownerId: group.creator_id || null,
              avatar_members: avatarMembers
            };
          })
        );
        
        commit('INIT_JOINED_GROUPS', groupsWithAvatars);
        return groupsWithAvatars;
      } catch (error) {
        console.error('加载已加入的群聊失败:', error);
        ElMessage.error('加载已加入的群聊失败，请重试');
        return [];
      }
    },
    
    // 刷新单个群聊信息
    async refreshJoinedGroup({ commit, rootState }, groupId) {
      try {
        if (!rootState.user?.id) {
          console.log('用户未登录，无法刷新群聊信息');
          return null;
        }
        
        const normalizedId = extractAndNormalizeId({ id: groupId, isGroup: true });
        
        const response = await axios.get(`${API_CONFIG.BASE_URL}/group/${normalizedId}`, {
          headers: { Authorization: `Bearer ${rootState.token}` }
        });
        
        if (response.data) {
          const updatedGroup = {
            id: normalizedId,
            normalizedId, // 添加规范化后的ID
            ...response.data,
            isGroup: true
          };
          
          commit('UPDATE_JOINED_GROUP', updatedGroup);
          return updatedGroup;
        }
      } catch (error) {
        console.error(`刷新群聊 ${groupId} 信息失败:`, error);
        ElMessage.error('刷新群聊信息失败');
        return null;
      }
    },
    
    // 保存最近聊天
    async saveRecentChat({ rootState, getters }, chatInfo) {
      try {
        if (!rootState.user?.id) {
          console.log('用户未登录，无法保存最近聊天记录');
          return;
        }
        
        if (!chatInfo) {
          console.error('saveRecentChat 错误：未提供聊天用户信息');
          return;
        }
        
        const isGroup = chatInfo.isGroup === true;
        const userId = rootState.user.id;
        
        // 规范化ID
        const normalizedId =  normalizeId(chatInfo.id, chatInfo.isGroup === true);
        
        // 对于群聊，先从已加入群聊中获取完整信息
        let fullChatInfo = { ...chatInfo, id: normalizedId, normalizedId };
        
        if (isGroup) {
          // 使用规范化ID查找群聊信息
          const joinedGroup = getters.getJoinedGroupById(normalizedId);
          if (joinedGroup) {
            fullChatInfo = { ...joinedGroup, ...chatInfo, id: normalizedId, normalizedId };
          } else {
            console.warn(`未找到群聊信息，ID: ${normalizedId}`);
          }
        }

        
        const recentChatData = {
          user_id: userId,
          target_id: normalizedId,
          target_username: fullChatInfo.username || fullChatInfo.name || '未知',
          target_photo: fullChatInfo.photo,
          last_message: fullChatInfo.lastMessage || '',
          last_message_time: fullChatInfo.lastMessageTime || new Date().toISOString(),
          unread_count: fullChatInfo.unreadCount || 0,
          is_group: isGroup,
          ...(isGroup ? { 
            group_id: normalizedId,
            members: fullChatInfo.members || [],
            members_count: fullChatInfo.membersCount || 0
          } : {})
        };
        
        await axios.post(`${API_CONFIG.BASE_URL}/ws/chat/recent-chats`, recentChatData, {
          headers: { Authorization: `Bearer ${rootState.token}` }
        });
      } catch (error) {
        console.error('保存最近聊天记录失败:', error);
        throw error;
      }
    },
    
    // 清除未读计数
    async clearUnreadCount({ commit, rootState }, targetId) {
      try {
        // 先判断是否为群聊ID（字符串且以group_开头）
        const isGroup = typeof targetId === 'string' && targetId.startsWith('group_');
        const normalizedId = normalizeId(targetId, isGroup);
        const userId = rootState.user.id;
        
        await axios.post(
          `${API_CONFIG.BASE_URL}/ws/chat/recent-chats/${userId}/clear-unread/${normalizedId}`, 
          {}, 
          { headers: { Authorization: `Bearer ${rootState.token}` } }
        );
        
        commit('UPDATE_UNREAD_COUNT', { targetId: normalizedId, count: 0 });
      } catch (error) {
        console.error('清除未读计数失败:', error);
        throw error;
      }
    },
    
    // 登出时清除所有聊天记录
    async clearAllChats({ commit }) {
      commit('CLEAR_ALL_CHATS');
    },
    
    // 手动添加群聊到最近聊天
    async addGroupToRecent({ commit, dispatch }, groupInfo) {
      // 规范化ID
      const normalizedId = extractAndNormalizeId({ ...groupInfo, isGroup: true });
      const normalizedGroupInfo = { ...groupInfo, id: normalizedId, normalizedId };
      
      commit('ADD_RECENT_CHAT', normalizedGroupInfo);
  
      await dispatch('saveRecentChat', normalizedGroupInfo);
    }
  },
  getters: {
    getRecentChats: state => state.recentChats,
    getRecentGroups: state => state.recentGroups,
    getRecentUsers: state => state.recentUsers,
    getJoinedGroups: state => state.joinedGroups,
    
    getChatById: state => (id) => {
      const normalizedId = extractAndNormalizeId({ id });
      return state.recentChats.find(chat => extractAndNormalizeId(chat) === normalizedId);
    },
    
    getJoinedGroupById: state => (id) => {
      const normalizedId = extractAndNormalizeId({ id });
      return state.joinedGroups.find(group => extractAndNormalizeId(group) === normalizedId);
    },
    
    getTotalUnreadCount: state => {
      return state.recentChats.reduce((total, chat) => total + (chat.unreadCount || 0), 0);
    },
    
    getJoinedGroupsCount: state => state.joinedGroups.length
  }
};

// 辅助函数：更新合并的聊天列表
function updateCombinedChats(state) {
  const allChats = [...state.recentGroups, ...state.recentUsers];
  allChats.sort((a, b) => {
    const timeA = a.lastMessageTime ? new Date(a.lastMessageTime) : new Date(0);
    const timeB = b.lastMessageTime ? new Date(b.lastMessageTime) : new Date(0);
    return timeB - timeA;
  });
  state.recentChats = allChats.slice(0, 50);
}

export default chatModule;