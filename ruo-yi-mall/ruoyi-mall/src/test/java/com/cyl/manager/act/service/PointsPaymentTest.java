package com.cyl.manager.act.service;

import com.cyl.manager.act.domain.entity.IntegralHistory;
import com.cyl.manager.act.mapper.IntegralHistoryMapper;
import com.cyl.manager.ums.mapper.MemberAccountMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PointsPaymentTest {
    private IntegralHistoryService service;
    private MemberAccountMapper accounts;
    private IntegralHistoryMapper histories;

    @BeforeEach void setup() {
        service = new IntegralHistoryService();
        accounts = mock(MemberAccountMapper.class);
        histories = mock(IntegralHistoryMapper.class);
        com.cyl.manager.ums.domain.entity.MemberAccount account = new com.cyl.manager.ums.domain.entity.MemberAccount();
        account.setIntegralBalance(new BigDecimal("100.00"));
        when(accounts.lockAccount(7L)).thenReturn(account);
        ReflectionTestUtils.setField(service, "memberAccountMapper", accounts);
        ReflectionTestUtils.setField(service, "integralHistoryMapper", histories);
    }

    @Test void insufficientBalanceDoesNotCreatePaymentHistory() {
        assertThrows(RuntimeException.class, () -> service.payWithPoints(7L, 99L, new BigDecimal("49.00")));
        verify(histories, never()).insert(any());
    }

    @Test void negativePaymentCannotCreditAccount() {
        assertThrows(RuntimeException.class, () -> service.payWithPoints(7L, 99L, new BigDecimal("-1.00")));
        verify(accounts, never()).updateIntegral(any(), anyLong());
        verify(histories, never()).insert(any());
    }

    @Test void paymentRecordsExactAmountOwnerAndOrder() {
        BigDecimal amount = new BigDecimal("49.25");
        when(accounts.updateIntegral(amount, 7L)).thenReturn(1);
        when(histories.insert(any())).thenReturn(1);
        service.payWithPoints(7L, 99L, amount);
        ArgumentCaptor<IntegralHistory> record = ArgumentCaptor.forClass(IntegralHistory.class);
        verify(histories).insert(record.capture());
        assertEquals(amount, record.getValue().getAmount());
        assertEquals(Long.valueOf(7), record.getValue().getMemberId());
        assertEquals(Long.valueOf(99), record.getValue().getOrderId());
        assertEquals(Integer.valueOf(22), record.getValue().getSubOpType());
        assertEquals(Integer.valueOf(2), record.getValue().getOpType());
    }

    @Test void missingRefundAccountDoesNotCreateIncomeHistory() {
        assertThrows(RuntimeException.class, () -> service.refundPoints(7L, 99L, BigDecimal.ONE));
        verify(histories, never()).insert(any());
    }

    @Test void failedLedgerWriteMustFailPaymentTransaction() {
        when(accounts.updateIntegral(BigDecimal.ONE, 7L)).thenReturn(1);
        assertThrows(RuntimeException.class, () -> service.payWithPoints(7L, 99L, BigDecimal.ONE));
    }
}
