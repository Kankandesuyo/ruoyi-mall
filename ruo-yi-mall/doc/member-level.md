# 用户等级、积分与权益

## 产品规则

积分是一份可消费的余额。用户可以选择用它购买商品、兑换优惠券或升级；余额减少不会降低等级，没有 EXP。等级只允许 LV1 → LV2 → LV3 → LV4 → LV5，累计升级消费 17000 积分。

|等级|升至此级消费|奖励倍率|
|---|---:|---:|
|LV1|0|1.00|
|LV2|500|1.10|
|LV3|1500|1.15|
|LV4|5000|1.20|
|LV5|10000|1.25|

奖励使用 BigDecimal 乘法并向下取整。已有商品小数价格和账户小数余额保留，退款按原额退回，不乘倍率。积分支付不会重复发放消费奖励。

## 原有结构与复用

- 后端：Spring Boot、MyBatis-Plus/MyBatis，商城模块 `ruoyi-mall`。
- 客户端：`ruoyi-mall-h5`，Vue 3、Element Plus、现有 Axios 封装。
- 用户：`ums_member.level` 已存在，原默认值为 0；直接复用，默认值改为 1，旧 0 迁移为 1。
- 余额：`ums_member_account.integral_balance` 是唯一实际账户余额；用户表旧 `integral` 字段不作为新系统的余额。
- 流水：复用 `act_integral_history`，新增 before_points、after_points、source、description。历史流水这些字段保持 NULL，不伪造历史余额。
- 认证：沿用 `/h5` 拦截器和 SecurityUtil，用户 ID 取自登录身份。
- 现有代码没有商品评论模块，所以新增最小的商品评论能力，无评分、上传或复杂社区功能。

## 新增与修改文件

后端新增：

- `sql/member-level.sql`：一次性数据库迁移。
- `ruoyi-mall/src/main/java/com/cyl/manager/ums/domain/entity/UserLevelConfig.java`：等级配置实体。
- `ruoyi-mall/src/main/java/com/cyl/manager/ums/mapper/UserLevelMapper.java`：配置、升级、外观和评论数据库访问。
- `ruoyi-mall/src/main/java/com/cyl/h5/service/H5LevelService.java`：权益校验和事务升级。
- `ruoyi-mall/src/main/java/com/cyl/h5/controller/H5LevelController.java`：客户端接口。
- `ruoyi-mall/src/test/java/com/cyl/h5/service/MemberLevelTest.java`：倍率、边界和越权测试。

后端修改：IntegralHistoryService、IntegralHistory、IntegralHistoryController、CouponActivityService、MemberService、MemberAccountService、PointsPaymentTest。统一积分变化，阻止直接覆盖余额、修改流水或从通用会员编辑接口改等级。

客户端新增：`src/api/level.js`、`src/views/LevelCenter.vue`、`src/components/MemberIdentity.vue`、`src/components/ProductComments.vue`。

客户端修改：路由、Profile.vue、Points.vue、GoodsDetail.vue、DefaultLayout.vue。积分页显示最终奖励和流水前后余额；个人中心提供等级入口；主题应用到客户端布局。

根目录 `scripts/init-local.cjs` 在新建本地库时也应用等级迁移。

## 数据库新增表

- `user_level_config`：五级名称、升级成本、倍率、权益描述，前端从接口读取。
- `user_level_history`：用户、前后等级、消耗和时间；唯一键 `(member_id,to_level)` 防止重复升级记录。
- `user_appearance`：每个用户一行，保存五类预设外观。
- `product_comment`：商品、用户、纯文本、时间和可选专属表情；按商品和 ID 索引分页，每页最多 20 条。

外观使用服务端预设 ID，不接受任意 CSS 或 RGB。白色昵称配深色底避免白底不可见；高等级使用静态边框、柔光、渐变，不使用持续动画。默认外观始终有效，旧低级外观在升级后仍可选。

## 接口

所有接口沿用现有 H5 风格，需要登录。

|方法|路径|用途|
|---|---|---|
|GET|/h5/member/level|当前身份、余额、等级配置、下一级与外观选项|
|POST|/h5/member/level/upgrade|请求 `{ "expectedLevel": 1 }` 升到下一等级|
|POST|/h5/member/level/appearance|保存 nicknameStyle、frame、font、background、theme 五项预设|
|GET|/h5/member/level/comments?productId=100&after=0|评论游标分页|
|POST|/h5/member/level/comments|请求 productId、content，可选 emote=star|

等级参数 expectedLevel 只用于检验用户确认时看到的状态，不决定升级目标。服务端自行查询当前等级并决定下一级。

## 数据与权限安全

升级在同一数据库事务内依次完成：锁积分账户 → 锁用户等级 → 检验 expectedLevel → 条件扣款 → 更新等级 → 写积分流水和升级记录。任一步失败全部回滚。

积分奖励、消费、退款和升级共用账户行锁；条件扣款额外检查余额充足。即使余额足够连续升两级，同一 expectedLevel 的重复请求也只能成功一次。客户端按钮防连击只是辅助。

评论最低 LV2；外观由服务端逐项校验；专属表情是独立结构化参数，最低 LV4。评论长 1～500 字、30 秒限一次，仅允许有效上架商品；用 Vue 文本插值渲染，不能注入 HTML。

后台积分调整：从积分流水新增接口记录收入或支出。管理员收入也应用倍率；支出按原额扣除。账户通用编辑与删除、历史流水修改与删除被拒绝，避免绕开审计。通用会员编辑不会变更等级。

## 部署与验证

已有环境：先备份数据库，停后端，执行 `sql/member-level.sql` 一次，再构建启动后端并构建客户端。迁移不是可重复执行脚本。当前本地环境已迁移；不要再次执行。迁移前备份位于根目录 `.runtime/before-member-level.sql`，属于本机私有数据，不应提交。

本机入口：http://127.0.0.1:5173/level 。未登录时会转到登录页。正常用户可从个人中心进入，不需要管理员为用户手工设置等级。

验证命令（PowerShell 中 Maven -D 参数使用引号）：

```powershell
mvn -f ruo-yi-mall/pom.xml -pl ruoyi-admin -am package '-Dtest=MemberLevelTest,MemberProfileTest,PointsPaymentTest' '-Dsurefire.failIfNoSpecifiedTests=false'
npm --prefix ruoyi-mall-h5 test
npm --prefix ruoyi-mall-h5 run build
```

本次验证：17 项后端定向测试、5 项 H5 测试和构建通过。真实 MySQL/API 验证覆盖默认等级、未登录拒绝、积分不足、故障回滚、六请求并发只扣一次、逐级费用、LV5上限、评论/外观权限、即时签到倍率、商城支付及流水一致性。100 基础积分的五个倍率和小数取整由单元测试覆盖。浏览器验证取消确认、600→100 的升级、余额不足按钮、发布评论和 HTML 文本转义；1366px 与390px页面已检查。

范围边界：全量测试中的两个原有 generator 测试依赖外部数据库/缺失 Bean，仍失败。本次未接入真实微信支付。当前数据库原有消费奖励配置的 orderAmount 为 0、orderCount 异常大；签到和积分支付可用，但若要启用原微信消费奖励回调，应先在后台修正配置，新代码对无效门槛明确报错。等级方案没有新增每日任务引擎，现有签到即当前可用积分活动。
