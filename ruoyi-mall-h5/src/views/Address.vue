<template>
  <div class="address-page">
    <div class="page-head">
      <h2>收货地址管理</h2>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增地址</el-button>
    </div>
    <div v-loading="loading" class="addr-list">
      <div v-for="a in list" :key="a.id" class="addr-card">
        <div class="addr-main">
          <div class="line1">
            <span class="name">{{ a.name }}</span>
            <span class="phone">{{ a.phone }}</span>
            <el-tag v-if="a.isDefault === 1" size="small" type="danger">默认</el-tag>
          </div>
          <div class="line2">{{ fullAddress(a) }}</div>
        </div>
        <div class="addr-op">
          <el-button text @click="openDialog(a)">编辑</el-button>
          <el-button text type="danger" @click="removeAddr(a)">删除</el-button>
        </div>
      </div>
      <el-empty v-if="!loading && !list.length" description="还没有收货地址" />
    </div>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑地址' : '新增地址'" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="收货人" prop="name">
          <el-input v-model="form.name" placeholder="收货人姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="手机号" />
        </el-form-item>
        <el-form-item label="所在地区">
          <el-input v-model="form.province" placeholder="省/直辖市" style="margin-bottom: 8px" />
          <el-input v-model="form.city" placeholder="市" style="margin-bottom: 8px" />
          <el-input v-model="form.district" placeholder="区/县" />
        </el-form-item>
        <el-form-item label="详细地址" prop="detailAddress">
          <el-input v-model="form.detailAddress" type="textarea" :rows="2" placeholder="街道、楼、门牌号" />
        </el-form-item>
        <el-form-item label="设为默认">
          <el-switch v-model="form.isDefault" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { list as addrList, create as addrCreate, update as addrUpdate, remove as addrRemove } from '@/api/address'

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const saving = ref(false)
const formRef = ref(null)

const form = reactive({
  id: null, name: '', phone: '', province: '', city: '', district: '',
  detailAddress: '', isDefault: 0
})
const rules = {
  name: [{ required: true, message: '请输入收货人', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  detailAddress: [{ required: true, message: '请输入详细地址', trigger: 'blur' }]
}

onMountedFun()

function onMountedFun() { load() }

async function load() {
  loading.value = true
  try {
    const res = await addrList()
    list.value = res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function openDialog(row) {
  if (row) {
    Object.assign(form, {
      id: row.id, name: row.name, phone: row.phone, province: row.province,
      city: row.city, district: row.district, detailAddress: row.detailAddress,
      isDefault: row.isDefault ?? 0
    })
  } else {
    Object.assign(form, {
      id: null, name: '', phone: '', province: '', city: '', district: '',
      detailAddress: '', isDefault: 0
    })
  }
  dialogVisible.value = true
}

async function save() {
  if (!formRef.value || saving.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      if (form.id) await addrUpdate({ ...form })
      else await addrCreate({ ...form })
      ElMessage.success(form.id ? '修改成功' : '添加成功')
      dialogVisible.value = false
      await load()
    } catch (e) {
      // 拦截器已提示
    } finally {
      saving.value = false
    }
  })
}

async function removeAddr(row) {
  try {
    await ElMessageBox.confirm('确定删除该地址吗？', '提示', { type: 'warning' })
    await addrRemove(row.id)
    ElMessage.success('删除成功')
    await load()
  } catch (e) {}
}

function fullAddress(a) {
  return [a.province, a.city, a.district, a.detailAddress].filter(Boolean).join(' ')
}
</script>

<style scoped>
.address-page {
  min-height: 400px;
}
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.page-head h2 {
  font-size: 20px;
}
.addr-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.addr-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.addr-main .line1 {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}
.addr-main .name {
  font-size: 16px;
  font-weight: 600;
}
.addr-main .phone {
  color: var(--text-sub);
}
.addr-main .line2 {
  color: var(--text-main);
  font-size: 14px;
}
</style>
