<template>
  <div v-loading="loading" class="profile-page">
    <MemberIdentity v-if="identity.level" :user="identity" />
    <el-button type="primary" @click="$router.push('/level')">等级中心 · 升级与身份外观</el-button>
    <!-- 会员信息卡 -->
    <div class="user-card">
      <div class="phone">{{ member.phone }}</div>
      <el-button class="edit-profile" @click="openEditor">编辑资料</el-button>
    </div>

    <el-dialog v-model="editing" title="编辑个人资料" width="420px" class="profile-dialog"
      :close-on-click-modal="!saving" :close-on-press-escape="!saving" :show-close="!saving" @closed="clearPreview">
      <el-form label-position="top" @submit.prevent="saveProfile">
        <el-form-item label="头像">
          <div class="avatar-editor">
            <el-avatar :size="88" :src="preview || avatarUrl(member.avatar)">{{ draftName?.charAt(0) || 'U' }}</el-avatar>
            <el-button :disabled="saving" @click="fileInput.click()">选择图片</el-button>
            <input ref="fileInput" type="file" accept="image/jpeg,image/png" hidden @change="selectAvatar" />
          </div>
          <p class="edit-hint">JPG / PNG，不超过2MB，宽高不超过4096像素；将居中裁成方形。</p>
        </el-form-item>
        <el-form-item label="用户名（昵称）">
          <el-input v-model="draftName" :disabled="saving" maxlength="30" show-word-limit placeholder="请输入用户名" />
          <p class="edit-hint">1～30个字符，仅修改展示名称；11位登录账号保持不变。</p>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="saving" @click="editing = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveProfile">保存资料</el-button>
      </template>
    </el-dialog>

    <div class="menu-card"><div class="menu-item" @click="$router.push('/points')">积分活动 · 签到领积分 / 查看余额和明细</div></div>
    <!-- 订单数量统计 -->
    <div class="stat-card">
      <div class="stat-title">我的订单</div>
      <div class="stat-grid">
        <div class="stat-item" @click="goOrders('0')">
          <el-badge :value="counts.unpaid || 0" :hidden="!counts.unpaid" :max="99">
            <el-icon :size="28"><Wallet /></el-icon>
          </el-badge>
          <span>待付款</span>
        </div>
        <div class="stat-item" @click="goOrders('1')">
          <el-badge :value="counts.nosend || 0" :hidden="!counts.nosend" :max="99">
            <el-icon :size="28"><Box /></el-icon>
          </el-badge>
          <span>待发货</span>
        </div>
        <div class="stat-item" @click="goOrders('2')">
          <el-badge :value="counts.noget || 0" :hidden="!counts.noget" :max="99">
            <el-icon :size="28"><Van /></el-icon>
          </el-badge>
          <span>待收货</span>
        </div>
        <div class="stat-item" @click="goOrders('3')">
          <el-icon :size="28"><CircleCheck /></el-icon>
          <span>已完成</span>
        </div>
      </div>
    </div>

    <!-- 功能入口 -->
    <div class="menu-card">
      <div class="menu-item" @click="$router.push('/orders')">
        <el-icon><List /></el-icon>
        <span class="menu-label">全部订单</span>
        <el-icon class="arrow"><ArrowRight /></el-icon>
      </div>
      <div class="menu-item" @click="$router.push('/cart')">
        <el-icon><ShoppingCart /></el-icon>
        <span class="menu-label">购物车</span>
        <el-icon class="arrow"><ArrowRight /></el-icon>
      </div>
      <div class="menu-item" @click="$router.push('/address')">
        <el-icon><Location /></el-icon>
        <span class="menu-label">收货地址</span>
        <el-icon class="arrow"><ArrowRight /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Wallet, Box, Van, CircleCheck, List, ShoppingCart, Location, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getMemberInfo, updateProfile } from '@/api/auth'
import { getUser, setUser } from '@/utils/auth'
import { avatarUrl } from '@/utils/avatar'
import MemberIdentity from '@/components/MemberIdentity.vue'
import { levelCenter } from '@/api/level'
const identity = ref({})
import { countOrder } from '@/api/order'

const router = useRouter()
const loading = ref(false)
const member = reactive({})
const counts = reactive({ unpaid: 0, nosend: 0, noget: 0, aftersale: 0 })
const emit = defineEmits(['profile-changed'])
const editing = ref(false)
const saving = ref(false)
const draftName = ref('')
const fileInput = ref(null)
const selectedFile = ref(null)
const preview = ref('')

function clearPreview() {
  if (preview.value) URL.revokeObjectURL(preview.value)
  preview.value = ''
  selectedFile.value = null
  if (fileInput.value) fileInput.value.value = ''
}
onBeforeUnmount(clearPreview)

function openEditor() {
  clearPreview()
  draftName.value = member.nickname || ''
  editing.value = true
}

function selectAvatar(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 2 * 1024 * 1024 || !file.size) {
    ElMessage.error('请选择不超过2MB的JPG或PNG图片')
    event.target.value = ''
    return
  }
  clearPreview()
  selectedFile.value = file
  preview.value = URL.createObjectURL(file)
}

function syncUser() {
  setUser({ ...getUser(), nickname: member.nickname, avatar: member.avatar })
  emit('profile-changed')
}

async function saveProfile() {
  if (saving.value) return
  const name = draftName.value.trim()
  if (!name || name.length > 30 || /[\u0000-\u001f\u007f-\u009f]/.test(name)) {
    ElMessage.error('请输入1至30个字符的用户名，不能包含控制字符')
    return
  }
  saving.value = true
  try {
    const res = await updateProfile(name, selectedFile.value)
    member.nickname = res.data.nickname
    member.avatar = res.data.avatar
    identity.value = { ...identity.value, nickname: member.nickname, avatar: member.avatar }
    syncUser()
    editing.value = false
    ElMessage.success('个人资料已更新')
  } catch (e) {
    // Request interceptor displays the server error; retain the draft for retry.
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  levelCenter().then(r => { identity.value = r.data }).catch(() => {})
  loadMember()
  loadCounts()
})

async function loadMember() {
  loading.value = true
  try {
    const res = await getMemberInfo()
    Object.assign(member, res.data || {})
    syncUser()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function loadCounts() {
  try {
    const res = await countOrder()
    Object.assign(counts, res.data || {})
  } catch (e) {
    console.error(e)
  }
}

function goOrders(status) {
  router.push({ path: '/orders', query: { status } })
}
</script>

<style scoped>
.profile-page {
  min-height: 400px;
}
.user-card {
  background: linear-gradient(135deg, #ff4400, #ff7a45);
  border-radius: 8px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 18px;
  color: #fff;
  margin-bottom: 16px;
}
.user-info .nickname {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
  overflow-wrap: anywhere;
}
.user-info { min-width: 0; flex: 1; }
.edit-profile { flex-shrink: 0; }
.avatar-editor { display: flex; align-items: center; gap: 18px; }
.edit-hint { color: var(--text-sub); font-size: 12px; line-height: 1.7; margin: 8px 0 0; }
:global(.profile-dialog) { max-width: calc(100vw - 32px); }
@media (max-width: 480px) {
  .user-card { flex-wrap: wrap; padding: 18px; }
  .extras { flex-wrap: wrap; }
}
.user-info .phone {
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 8px;
}
.extras {
  display: flex;
  gap: 8px;
}
.stat-card, .menu-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 16px;
}
.stat-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 14px;
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  text-align: center;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--text-main);
}
.stat-item span {
  font-size: 13px;
}
.stat-item:hover {
  color: var(--primary);
}
.menu-item {
  display: flex;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}
.menu-item:last-child {
  border-bottom: none;
}
.menu-item .menu-label {
  flex: 1;
  margin-left: 8px;
  font-size: 14px;
}
.menu-item .arrow {
  color: var(--text-sub);
}
</style>
