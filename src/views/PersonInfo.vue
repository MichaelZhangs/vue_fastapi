<template>
  <div class="profile-page">
    <h1>个人资料</h1>
    <div class="profile-container">
      <!-- 头像 -->
      <div class="avatar-section">
        <img :src="user?.photo || defaultAvatar" alt="头像" class="avatar" />
        <button @click="changeAvatar" class="change-avatar-button">更换头像</button>
      </div>

      <!-- 用户信息 -->
      <div class="info-section">
        <div class="info-item">
          <label>名字：</label>
          <span>{{ user?.username || "未设置" }}</span>
        </div>
        <div class="info-item">
          <label>性别：</label>
          <span>{{ user?.sex || "未设置" }}</span>
        </div>
        <div class="info-item">
          <label>手机号：</label>
          <span>{{ user?.phone || "未设置" }}</span>
        </div>
        <div class="info-item">
          <label>描述：</label>
          <span>{{ user?.description || "未设置" }}</span>
        </div>
      </div>

      <!-- 个人二维码 -->
      <div class="qr-code-section">
        <h2>个人二维码</h2>
        <img :src="qrcodeUrl || defaultqrcode" alt="个人二维码" class="qr-code" />
        <button @click="generateQrcode" class="generate-button">生成二维码</button>
        <button @click="downloadQrcode" class="download-button">下载二维码</button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import defaultAvatar from '@/assets/default-avatar.png';
import defaultqrcode from '@/assets/logo.png';
import QRCode from 'qrcode';

export default {
  name: 'PersonInfo',
  setup() {
    const store = useStore();
    const user = computed(() => store.state.user);
    const qrcodeUrl = ref('');

    // 生成二维码
    const generateQrcode = async () => {
      try {
        const content = `用户名: ${user.value.username}\n手机号: ${user.value.phone}`;
        const url = await QRCode.toDataURL(content);
        qrcodeUrl.value = url;
        alert("二维码生成成功");
      } catch (error) {
        console.error("生成二维码失败", error);
        alert("生成二维码失败");
      }
    };

    // 下载二维码
    const downloadQrcode = () => {
      if (qrcodeUrl.value) {
        const link = document.createElement('a');
        link.href = qrcodeUrl.value;
        link.download = 'my-qrcode.png';
        link.click();
      } else {
        alert("请先生成二维码");
      }
    };

    // 更换头像
    const changeAvatar = () => {
      alert("更换头像功能待实现");
    };

    return {
      user,
      defaultAvatar,
      defaultqrcode,
      qrcodeUrl,
      generateQrcode,
      downloadQrcode,
      changeAvatar,
    };
  },
};
</script>

<style scoped>
.profile-page {
  padding: 20px;
}

h1 {
  font-size: 24px;
  margin-bottom: 20px;
}

.profile-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
}

.change-avatar-button {
  padding: 5px 10px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.change-avatar-button:hover {
  background-color: #40a9ff;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-item label {
  font-weight: bold;
  width: 80px;
}

.qr-code-section {
  margin-top: 20px;
}

.qr-code {
  width: 200px;
  height: 200px;
  margin-top: 10px;
}

.generate-button,
.download-button {
  padding: 5px 10px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  margin-right: 10px;
}

.generate-button:hover,
.download-button:hover {
  background-color: #40a9ff;
}
</style>