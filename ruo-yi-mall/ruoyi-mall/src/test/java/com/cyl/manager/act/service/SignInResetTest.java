package com.cyl.manager.act.service;

import com.cyl.manager.act.mapper.SignInCycleMapper;
import com.cyl.manager.act.mapper.IntegralHistoryMapper;
import com.cyl.manager.ums.mapper.MemberAccountMapper;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SignInResetTest {
    @Test void resetOnlyAdvancesCycleAndPreservesPointsAndLedger() {
        IntegralHistoryService service = new IntegralHistoryService();
        SignInCycleMapper cycles = mock(SignInCycleMapper.class);
        MemberAccountMapper accounts = mock(MemberAccountMapper.class);
        IntegralHistoryMapper histories = mock(IntegralHistoryMapper.class);
        ReflectionTestUtils.setField(service, "signInCycleMapper", cycles);
        ReflectionTestUtils.setField(service, "memberAccountMapper", accounts);
        ReflectionTestUtils.setField(service, "integralHistoryMapper", histories);
        when(cycles.reset(4L)).thenReturn(1, 0);
        service.resetTodaySignIn(4L);
        assertThrows(IllegalArgumentException.class, () -> service.resetTodaySignIn(4L));
        assertThrows(IllegalArgumentException.class, () -> service.resetTodaySignIn(null));
        assertThrows(IllegalArgumentException.class, () -> service.resetTodaySignIn(-1L));
        verify(cycles, times(2)).reset(4L);
        verifyNoInteractions(accounts, histories);
    }
}
