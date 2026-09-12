<template>
  <div class="login-page">
    <div class="login-box">
      <div class="brand">
        <div class="logo-text">若依商城</div>
        <p class="slogan">{{ registering ? '创建账号，开启购物之旅' : '欢迎登录，开启购物之旅' }}</p>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin">
        <el-form-item prop="mobile">
          <el-input v-model="form.mobile" placeholder="请输入11位数字账号" inputmode="numeric" maxlength="11" autocomplete="username" :prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password"  :placeholder="registering ? '自设密码（6至20位）' : '请输入密码'" :autocomplete="registering ? 'new-password' : 'current-password'" :prefix-icon="Lock" size="large" show-password @keyup.enter="handleLogin" />
        </el-form-item>
        <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="handleLogin">{{ registering ? '注 册 并 登 录' : '登 录' }}</el-button>
        <div class="tips">
          <span>{{ registering ? '已有账号？' : '还没有账号？' }}</span>
          <el-button link type="primary" :disabled="loading" @click="toggleMode">{{ registering ? '返回登录' : '立即注册' }}</el-button>
          <p v-if="registering">任意11位数字即可，无需短信或微信验证。</p>
        </div>
        <div class="back-home">
          <el-button text @click="$router.push('/home')">返回首页</el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { login, register, getMemberInfo } from '@/api/auth'
import { safeRedirect } from '@/utils/contract'
import { setToken, setUser, removeToken } from '@/utils/auth'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const registering = ref(false)
function toggleMode() {
  registering.value = !registering.value
  form.password = ''
  formRef.value?.clearValidate()
}

const form = reactive({ mobile: '', password: '' })
const rules = {
  mobile: [{ required: true, message: '请输入11位数字账号', trigger: 'blur' }, { pattern: /^[0-9]{11}$/, message: '账号必须为11位数字', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, {
    validator: (_, value, callback) => callback(registering.value && (!value.trim() || value.length < 6 || value.length > 20) ? new Error('密码须为6至20位，不能全为空格') : undefined), trigger: 'blur'
  }]
}

async function handleLogin() {
  if (!formRef.value || loading.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      const res = await (registering.value ? register : login)({ mobile: form.mobile, password: form.password })
      const token = res.data?.token
      if (!token) {
        ElMessage.error('登录失败：未返回 token')
        return
      }
      setToken(token)
      // 拉取会员信息
      let userObj = { username: form.mobile, phone: form.mobile }
      try {
        const mres = await getMemberInfo()
        const m = mres.data || {}
        userObj = {
          id: m.id,
          username: form.mobile,
          nickname: m.nickname,
          phone: m.phone,
          avatar: m.avatar,
          role: 'USER'
        }
      } catch (e) {
        removeToken()
        return
      }
      setUser(userObj)
      ElMessage.success(registering.value ? '注册成功，已自动登录' : '登录成功')
      const redirect = route.query.redirect
      router.replace(safeRedirect(redirect))
    } catch (e) {
      // 拦截器已提示
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #ff4400 0%, #ff7a45 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-box {
  width: 380px;
  background: #fff;
  border-radius: 12px;
  padding: 40px 36px 32px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}
.brand {
  text-align: center;
  margin-bottom: 28px;
}
.logo-text {
  font-size: 26px;
  font-weight: 800;
  color: var(--primary);
}
.slogan {
  color: var(--text-sub);
  font-size: 13px;
  margin-top: 8px;
}
.submit-btn {
  width: 100%;
  margin-top: 6px;
  background: var(--primary);
  border-color: var(--primary);
}
.tips {
  text-align: center;
  color: var(--text-sub);
  font-size: 12px;
  margin-top: 16px;
}
.back-home {
  text-align: center;
  margin-top: 8px;
}
</style>
