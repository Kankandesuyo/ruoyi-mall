package com.cyl.manager.ums.mapper;

import java.math.BigDecimal;
import java.util.List;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Param;
import com.cyl.manager.ums.domain.entity.MemberAccount;

/**
 * 会员账户表Mapper接口
 * 
 * @author zcc
 */
public interface MemberAccountMapper extends BaseMapper<MemberAccount> {
    /**
     * 查询会员账户表列表
     *
     * @param memberAccount 会员账户表
     * @return 会员账户表集合
     */
    List<MemberAccount> selectByEntity(MemberAccount memberAccount);

    @org.apache.ibatis.annotations.Insert("INSERT INTO ums_member_account(member_id, integral_balance, total_integral_balance, create_time) VALUES(#{memberId},0,0,NOW()) ON DUPLICATE KEY UPDATE member_id=VALUES(member_id)")
    int ensureAccount(@Param("memberId") Long memberId);

    @org.apache.ibatis.annotations.Select("SELECT * FROM ums_member_account WHERE member_id=#{memberId} FOR UPDATE")
    MemberAccount lockAccount(@Param("memberId") Long memberId);

    @org.apache.ibatis.annotations.Update("UPDATE ums_member_account SET integral_balance=integral_balance+#{amount}, update_time=NOW() WHERE member_id=#{memberId}")
    int refundIntegral(@Param("amount") BigDecimal amount, @Param("memberId") Long memberId);

    int updateIntegralBalance(@Param("amount") BigDecimal amount, @Param("memberId") Long memberId);

    int updateIntegral(@Param("useIntegral") BigDecimal useIntegral, @Param("memberId") Long memberId);
}
