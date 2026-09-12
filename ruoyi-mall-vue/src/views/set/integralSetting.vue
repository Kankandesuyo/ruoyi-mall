<template>
  <div class="app-container">
    <el-card>
      <div slot="header" class="clearfix">
        <div class="flex-center">
          <h2>积分获取规则</h2>
          <el-button class="ml-auto" type="primary" @click="saveData">保存
          </el-button>
        </div>
      </div>
      <el-alert title="商城使用活动积分支付；积分订单不再赠送消费积分，下方消费规则仅用于历史现金订单。" type="info" :closable="false" />
      <el-form :model="incomeVal" label-width="180px">
        <el-form-item label="签到活动状态">
          <el-switch v-model="incomeVal.signStatus" :active-value="1" :inactive-value="0"/>
        </el-form-item>
        <el-form-item label="签到状态管理">
          <el-button v-hasPermi="['system:config:edit']" type="warning" plain icon="el-icon-refresh-left" :loading="resetting" @click="resetSignIn">重置今日签到</el-button>
          <div class="reset-hint">重置所有会员今天的签到资格，允许再次领取；已发积分与历史流水保留。</div>
        </el-form-item>
        <el-form-item label="每日签到固定积分">
          <el-input
            type="number"
            v-model="incomeVal.signCount"
            style="width:200px"
            placeholder="每天签到获取的积分"
          >
            <template slot="append">
              <span>积分</span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="消费获得积分">
          <div class="flex-center">
            <span class="mr5">每消费</span>
            <el-input
              type="number"
              v-model="incomeVal.orderAmount"
              style="width:200px"
              placeholder="每天签到获取的积分"
            >
              <template slot="append">
                <span>元</span>
              </template>
            </el-input>
            <span class="ml5 mr5">，获得</span>
            <el-input
              type="number"
              v-model="incomeVal.orderCount"
              style="width:200px"
              placeholder="每天签到获取的积分"
            >
              <template slot="append">
                <span>积分</span>
              </template>
            </el-input>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import {addOrUpdate, getConfigKey2} from "@/api/system/config";

import request from "@/utils/request";

const key = "activity-integral-income-set-key"

const defaultIncomeVal = {
  signStatus: 1,
  signCount: 1,
  orderAmount: 1,
  orderCount: 1
}

export default {
  data() {
    return {
      resetting: false,
      incomeObj: {},
      incomeVal: {},
    }
  },
  methods: {
    async resetSignIn() {
      if (this.resetting) return
      this.resetting = true
      try {
        const res = await request({ url: '/act/integralHistory/signIn/resetStatus', method: 'get' })
        const status = res.data || res
        await this.$confirm(`${status.date} 当前签到人数：${status.signedCount}。将重置所有会员今日签到状态，重置后可再次领取积分，已发积分不会扣回。是否继续？`, '确认重置今日签到', {
          confirmButtonText: '确认重置', cancelButtonText: '取消', type: 'warning'
        })
        await request({ url: '/act/integralHistory/signIn/reset', method: 'post', data: { expectedVersion: status.version } })
        this.$modal.msgSuccess('今日签到已重置，会员可再次签到领取积分')
      } catch (error) {
        // Cancellation does nothing; request interceptor reports API failures.
      } finally {
        this.resetting = false
      }
    },
    initData() {
      getConfigKey2(key).then(res => {
        if (res.data) {
          this.incomeObj = res.data
          this.incomeVal = JSON.parse(res.data.configValue)
        } else {
          this.incomeVal = {...defaultIncomeVal}
          this.incomeObj = {
            configValue: JSON.stringify(this.incomeVal),
            configKey: key,
            configType: 'N',
            configName: '积分获取规则',
            configId: null
          }
        }
      })
    },
    saveData() {
      const points = Number(this.incomeVal.signCount)
      if (!Number.isFinite(points) || points <= 0 || points > 99999999.99 || Math.abs(points * 100 - Math.round(points * 100)) > 0.00001) {
        this.$modal.msgError('每日积分须大于0、不超过99999999.99，且最多两位小数')
        return
      }
      let self = this;
      this.$modal.confirm('是否确认要保存积分获取规则？').then(function () {
        self.incomeObj.configValue = JSON.stringify(self.incomeVal)
        return addOrUpdate(self.incomeObj);
      }).then(() => {
        this.initData();
        this.$modal.msgSuccess("保存成功");
      }).catch(() => {
      });
    },
  },
  created() {
    this.initData()
  },
}
</script>

<style lang="scss" scoped>
.reset-hint { color: #909399; font-size: 12px; line-height: 1.7; margin-top: 8px; }
.number-input {
  width: 120px;
}

.jc {
  justify-content: center;
}
</style>
