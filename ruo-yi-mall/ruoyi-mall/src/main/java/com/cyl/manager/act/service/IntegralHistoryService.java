package com.cyl.manager.act.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

import com.alibaba.fastjson.JSON;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.cyl.h5.config.SecurityUtil;
import com.cyl.manager.act.constant.IntegralRule;
import com.cyl.manager.act.domain.vo.IntegralStatVO;
import com.cyl.manager.ums.domain.entity.MemberAccount;
import com.cyl.manager.ums.mapper.MemberAccountMapper;
import com.github.pagehelper.PageHelper;
import com.ruoyi.common.constant.Constants;
import com.ruoyi.system.service.ISysConfigService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import com.cyl.manager.act.mapper.IntegralHistoryMapper;
import com.cyl.manager.act.domain.entity.IntegralHistory;
import com.cyl.manager.act.domain.query.IntegralHistoryQuery;
import org.springframework.transaction.annotation.Transactional;

/**
 * 积分流水表Service业务层处理
 *
 * @author zcc
 */
@Service
@Slf4j
@Transactional(rollbackFor = Exception.class)
public class IntegralHistoryService {
    @Autowired
    private IntegralHistoryMapper integralHistoryMapper;
    @Autowired
    private MemberAccountMapper memberAccountMapper;
    @Autowired
    private ISysConfigService sysConfigService;
    @Autowired
    private com.cyl.manager.act.mapper.SignInCycleMapper signInCycleMapper;
    @Autowired
    private com.cyl.manager.ums.mapper.UserLevelMapper levelMapper;

    /**
     * 查询积分流水表
     *
     * @param id 积分流水表主键
     * @return 积分流水表
     */
    public IntegralHistory selectById(Long id) {
        return integralHistoryMapper.selectById(id);
    }

    /**
     * 查询积分流水表列表
     *
     * @param query 查询条件
     * @param page  分页条件
     * @return 积分流水表
     */
    public List<IntegralHistory> selectList(IntegralHistoryQuery query, Pageable page) {
        if (page != null) {
            PageHelper.startPage(page.getPageNumber() + 1, page.getPageSize());
        }
        QueryWrapper<IntegralHistory> qw = new QueryWrapper<>();
        Long memberId = query.getMemberId();
        if (memberId != null) {
            qw.eq("member_id", memberId);
        }
        BigDecimal amount = query.getAmount();
        if (amount != null) {
            qw.eq("amount", amount);
        }
        Integer opType = query.getOpType();
        if (opType != null) {
            qw.eq("op_type", opType);
        }
        Integer subOpType = query.getSubOpType();
        if (subOpType != null) {
            qw.eq("sub_op_type", subOpType);
        }
        BigDecimal orderAmount = query.getOrderAmount();
        if (orderAmount != null) {
            qw.eq("order_amount", orderAmount);
        }
        Long orderId = query.getOrderId();
        if (orderId != null) {
            qw.eq("order_id", orderId);
        }
        return integralHistoryMapper.selectList(qw);
    }

    public List<IntegralHistory> selectList2(IntegralHistoryQuery query) {
        QueryWrapper<IntegralHistory> qw = new QueryWrapper<>();
        Long memberId = query.getMemberId();
        if (memberId != null) {
            qw.eq("member_id", memberId);
        }
        Integer opType = query.getOpType();
        if (opType != null) {
            qw.eq("op_type", opType);
        }
        Integer subOpType = query.getSubOpType();
        if (subOpType != null) {
            qw.eq("sub_op_type", subOpType);
        }
        if (query.getStart() != null) {
            qw.ge("create_time", query.getStart());
        }
        if (query.getEnd() != null) {
            qw.le("create_time", query.getEnd());
        }
        return integralHistoryMapper.selectList(qw);
    }

    /**
     * 新增积分流水表
     *
     * @param integralHistory 积分流水表
     * @return 结果
     */
    public int insert(IntegralHistory integralHistory) {
        integralHistory.setCreateTime(LocalDateTime.now());
        return integralHistoryMapper.insert(integralHistory);
    }

    public IntegralRule activityRule() {
        String config = sysConfigService.selectConfigByKey(Constants.INTEGRAL_RULE_KEY);
        return StringUtils.isNotBlank(config) ? JSON.parseObject(config, IntegralRule.class) : new IntegralRule();
    }

    public java.util.Map<String, Object> activity() {
        Long memberId = SecurityUtil.getLocalMember().getId();
        MemberAccount account = memberAccountMapper.selectById(memberId);
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("balance", account == null ? BigDecimal.ZERO : account.getIntegralBalance());
        IntegralRule rule = activityRule();
        result.put("rule", rule);
        Integer level = levelMapper.lockedLevel(memberId);
        result.put("reward", calculatePointReward(rule.getSignCount() == null ? BigDecimal.ZERO : rule.getSignCount(), level));
        result.put("level", level);
        result.put("multiplier", levelMapper.config(level).getPointMultiplier());
        result.put("signedToday", signedToday(memberId, signInCycleMapper.currentVersion()));
        return result;
    }

    private boolean signedToday(Long memberId, Long version) {
        LocalDateTime start = java.time.LocalDate.now().atStartOfDay();
        return integralHistoryMapper.selectCount(new QueryWrapper<IntegralHistory>()
            .eq("member_id", memberId).eq("sub_op_type", 11).eq("sign_in_version", version)
            .ge("create_time", start).lt("create_time", start.plusDays(1))) > 0;
    }

    public java.util.Map<String, Object> signInResetStatus() {
        Long version = signInCycleMapper.currentVersion();
        LocalDateTime start = java.time.LocalDate.now().atStartOfDay();
        Integer count = integralHistoryMapper.selectCount(new QueryWrapper<IntegralHistory>()
            .eq("sub_op_type", 11).eq("sign_in_version", version)
            .ge("create_time", start).lt("create_time", start.plusDays(1)));
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("version", version);
        result.put("signedCount", count);
        result.put("date", java.time.LocalDate.now().toString());
        return result;
    }

    public void resetTodaySignIn(Long expectedVersion) {
        if (expectedVersion == null || expectedVersion < 0)
            throw new IllegalArgumentException("请刷新后重新确认重置");
        if (signInCycleMapper.reset(expectedVersion) != 1)
            throw new IllegalArgumentException("签到状态已经重置，请刷新后查看");
    }

    public int signIn() {
        Long version = signInCycleMapper.lockCurrentVersion();
        Long memberId = SecurityUtil.getLocalMember().getId();
        memberAccountMapper.ensureAccount(memberId);
        memberAccountMapper.lockAccount(memberId);
        IntegralRule rule = activityRule();
        if (!Integer.valueOf(1).equals(rule.getSignStatus()) || rule.getSignCount() == null || rule.getSignCount().signum() <= 0)
            throw new RuntimeException("签到活动暂未开放");
        if (rule.getSignCount().compareTo(new BigDecimal("99999999.99")) > 0 || rule.getSignCount().stripTrailingZeros().scale() > 2)
            throw new RuntimeException("签到奖励配置无效，请联系管理员设置不超过99999999.99且最多两位小数的积分");
        if (signedToday(memberId, version)) throw new RuntimeException("今天已经领取过签到积分");
        IntegralHistory history = new IntegralHistory();
        history.setMemberId(memberId);
        history.setAmount(rule.getSignCount());
        history.setSignInVersion(version);
        history.setOpType(1);
        history.setSubOpType(11);
        history.setCreateTime(LocalDateTime.now());
        return insert2(history);
    }

    public BigDecimal calculatePointReward(BigDecimal basePoints, int level) {
        if (basePoints == null || basePoints.signum() < 0) throw new IllegalArgumentException("基础积分无效");
        com.cyl.manager.ums.domain.entity.UserLevelConfig config = levelMapper.config(level);
        if (config == null || config.getPointMultiplier().signum() <= 0) throw new IllegalArgumentException("等级倍率配置无效");
        return basePoints.multiply(config.getPointMultiplier()).setScale(0, RoundingMode.DOWN);
    }

    public void consumePoints(Long memberId, BigDecimal amount, String source, int subType, Long orderId) {
        if (amount == null || amount.signum() < 0 || amount.stripTrailingZeros().scale() > 2) throw new IllegalArgumentException("消费积分无效");
        memberAccountMapper.ensureAccount(memberId);
        MemberAccount account = memberAccountMapper.lockAccount(memberId);
        if (amount.signum() > 0 && memberAccountMapper.updateIntegral(amount, memberId) != 1)
            throw new IllegalArgumentException("积分不足，请参加积分活动");
        recordChange(memberId, orderId, amount, 2, subType, source, account.getIntegralBalance());
    }

    public void payWithPoints(Long memberId, Long orderId, BigDecimal amount) {
        consumePoints(memberId, amount, "PURCHASE", 22, orderId);
    }

    public void refundPoints(Long memberId, Long orderId, BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) throw new IllegalArgumentException("退款积分无效");
        MemberAccount account = memberAccountMapper.lockAccount(memberId);
        if (account == null || memberAccountMapper.refundIntegral(amount, memberId) != 1) throw new IllegalStateException("积分账户不存在");
        recordChange(memberId, orderId, amount, 1, 13, "REFUND", account.getIntegralBalance());
    }

    private void recordChange(Long memberId, Long orderId, BigDecimal amount, int type, int subType, String source, BigDecimal before) {
        IntegralHistory history = new IntegralHistory();
        history.setMemberId(memberId); history.setOrderId(orderId); history.setAmount(amount);
        history.setOrderAmount(amount); history.setOpType(type); history.setSubOpType(subType);
        history.setSource(source); history.setDescription(source); history.setBeforePoints(before);
        history.setAfterPoints(type == 2 ? before.subtract(amount) : before.add(amount));
        if (insert(history) != 1) throw new IllegalStateException("积分流水保存失败");
    }

    public int insert2(IntegralHistory history) {
        Long memberId = history.getMemberId();
        memberAccountMapper.ensureAccount(memberId);
        MemberAccount account = memberAccountMapper.lockAccount(memberId);
        Integer level = levelMapper.lockedLevel(memberId);
        BigDecimal reward = calculatePointReward(history.getAmount(), level);
        history.setAmount(reward); history.setOpType(1);
        history.setBeforePoints(account.getIntegralBalance());
        history.setAfterPoints(account.getIntegralBalance().add(reward));
        history.setSource(history.getSource() != null ? history.getSource() : Integer.valueOf(11).equals(history.getSubOpType()) ? "SIGN_IN" : "PURCHASE_REWARD");
        history.setDescription(history.getSource() + " LV" + level + " reward");
        history.setCreateTime(LocalDateTime.now());
        if (memberAccountMapper.updateIntegralBalance(reward, memberId) != 1 || integralHistoryMapper.insert(history) != 1)
            throw new IllegalStateException("积分奖励保存失败");
        return 1;
    }

    public int adminChange(IntegralHistory history) {
        IntegralHistory change = new IntegralHistory();
        change.setMemberId(history.getMemberId()); change.setAmount(history.getAmount());
        change.setSource("ADMIN"); change.setSubOpType(14);
        if (Integer.valueOf(1).equals(history.getOpType())) return insert2(change);
        if (Integer.valueOf(2).equals(history.getOpType())) {
            consumePoints(history.getMemberId(), history.getAmount(), "ADMIN", 25, null); return 1;
        }
        throw new IllegalArgumentException("积分调整类型无效");
    }

    public void handleIntegral(Long orderId, BigDecimal amount, Long memberId) {
        String config = sysConfigService.selectConfigByKey(Constants.INTEGRAL_RULE_KEY);
        IntegralRule rule;
        if (StringUtils.isNotEmpty(config)) {
            rule = JSON.parseObject(config, IntegralRule.class);
        } else {
            rule = new IntegralRule();
        }
        if (rule.getOrderAmount() == null || rule.getOrderAmount().signum() <= 0 || rule.getOrderCount() == null || rule.getOrderCount().signum() < 0)
            throw new IllegalArgumentException("消费奖励配置无效：门槛须大于0，奖励不得为负数");
        BigDecimal divide = amount.divide(rule.getOrderAmount(), 0, RoundingMode.DOWN);
        if (divide.compareTo(BigDecimal.ZERO) < 1) {
            log.info("订单：{}，金额：{}不足{}元，不记录积分",orderId,amount,rule.getOrderAmount());
            return;
        }
        BigDecimal total = divide.multiply(rule.getOrderCount());
        if (total.compareTo(BigDecimal.ZERO) < 1) {
            log.info("订单：{}，orderCount为0，不记录积分",orderId);
            return;
        }
        IntegralHistory history = new IntegralHistory();
        history.setOpType(1);
        history.setSubOpType(12);
        history.setAmount(total);
        history.setOrderId(orderId);
        history.setOrderAmount(amount);
        history.setMemberId(memberId);
        history.setCreateTime(LocalDateTime.now());
        insert2(history);
    }

    /**
     * 修改积分流水表
     *
     * @param integralHistory 积分流水表
     * @return 结果
     */
    public int update(IntegralHistory integralHistory) {
        throw new IllegalArgumentException("积分流水不可修改，请通过积分调整记录更正");
    }

    /**
     * 删除积分流水表信息
     *
     * @param id 积分流水表主键
     * @return 结果
     */
    public int deleteById(Long id) {
        throw new IllegalArgumentException("积分流水不可删除");
    }

    public List<IntegralHistory> selectListByH5(IntegralHistoryQuery query, Pageable page) {
        if (page != null) {
            PageHelper.startPage(page.getPageNumber() + 1, page.getPageSize());
        }
        QueryWrapper<IntegralHistory> qw = new QueryWrapper<>();
        qw.eq("member_id", SecurityUtil.getLocalMember().getId())
                .ge(query.getStart() != null, "create_time", query.getStart())
                .le(query.getEnd() != null, "create_time", query.getEnd());
        Integer opType = query.getOpType();
        if (opType != null) {
            qw.eq("op_type", opType);
        }
        Integer subOpType = query.getSubOpType();
        if (subOpType != null) {
            qw.eq("sub_op_type", subOpType);
        }
        qw.orderByDesc("id");
        return integralHistoryMapper.selectList(qw);
    }

    public IntegralStatVO statIntegral(IntegralHistoryQuery query) {
        Long memberId = SecurityUtil.getLocalMember().getId();
        IntegralStatVO statVO = integralHistoryMapper.statIntegral(query.getStart(), query.getEnd(), memberId);
        if (statVO == null) {
            statVO = new IntegralStatVO();
        }
        MemberAccount memberAccount = memberAccountMapper.selectById(memberId);
        statVO.setBalance(memberAccount == null ? BigDecimal.ZERO : memberAccount.getIntegralBalance());
        return statVO;
    }
}
