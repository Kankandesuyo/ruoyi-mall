package com.cyl.h5.service;

import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.cyl.manager.ums.domain.entity.Member;
import com.cyl.manager.ums.mapper.MemberMapper;
import com.ruoyi.common.config.RuoYiConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class MemberProfileTest {
    @TempDir Path folder;
    private H5MemberProfileService service;
    private MemberMapper mapper;

    @BeforeEach void setup() {
        mapper = mock(MemberMapper.class);
        service = new H5MemberProfileService();
        ReflectionTestUtils.setField(service, "memberMapper", mapper);
        new RuoYiConfig().setProfile(folder.toString());
        Member member = new Member();
        member.setId(7L);
        member.setStatus(1);
        member.setAvatar("/profile/avatar/old.png");
        when(mapper.selectById(7L)).thenReturn(member);
        when(mapper.update(isNull(), any())).thenReturn(1);
    }

    @Test void missingIdentityCannotWrite() {
        assertThrows(RuntimeException.class, () -> service.update(null, "用户", null));
        verify(mapper, never()).update(any(), any());
    }

    @Test void invalidNamesCannotWrite() {
        for (String name : new String[]{"", "   ", "a\nb", new String(new char[31]).replace('\0', 'a')}) {
            assertThrows(IllegalArgumentException.class, () -> service.update(7L, name, null));
        }
        verify(mapper, never()).update(any(), any());
    }

    @Test void nicknameOnlyPreservesAvatarAndScopesUpdate() throws Exception {
        assertEquals("/profile/avatar/old.png", service.update(7L, "  新用户  ", null).getAvatar());
        ArgumentCaptor<UpdateWrapper> capture = ArgumentCaptor.forClass(UpdateWrapper.class);
        verify(mapper).update(isNull(), capture.capture());
        UpdateWrapper wrapper = capture.getValue();
        assertTrue(wrapper.getSqlSegment().contains("id ="));
        assertTrue(wrapper.getParamNameValuePairs().containsValue(7L));
        assertTrue(wrapper.getParamNameValuePairs().containsValue("新用户"));
        assertFalse(wrapper.getSqlSet().contains("avatar"));
        assertFalse(wrapper.getSqlSet().contains("password"));
        assertFalse(wrapper.getSqlSet().contains("status"));
    }

    @Test void spoofedAndOversizeFilesCannotWrite() {
        MockMultipartFile fake = new MockMultipartFile("avatar", "image.png", "image/png", "<script>alert(1)</script>".getBytes());
        MockMultipartFile big = new MockMultipartFile("avatar", "image.png", "image/png", new byte[2 * 1024 * 1024 + 1]);
        assertThrows(IllegalArgumentException.class, () -> service.update(7L, "用户", fake));
        assertThrows(IllegalArgumentException.class, () -> service.update(7L, "用户", big));
        verify(mapper, never()).update(any(), any());
    }

    @Test void validImageIsReencodedAndCroppedUsingServerFilename() throws Exception {
        String url = service.update(7L, "用户", image()).getAvatar();
        assertTrue(url.matches("/profile/avatar/member/[a-f0-9-]+\\.png"));
        Path file = folder.resolve(url.substring("/profile/".length()));
        BufferedImage result = ImageIO.read(file.toFile());
        assertEquals(64, result.getWidth());
        assertEquals(64, result.getHeight());
    }

    @Test void failedDatabaseWriteRemovesNewImage() throws Exception {
        when(mapper.update(isNull(), any())).thenReturn(0);
        assertThrows(IllegalStateException.class, () -> service.update(7L, "用户", image()));
        try (Stream<Path> files = Files.walk(folder)) {
            assertEquals(0, files.filter(Files::isRegularFile).count());
        }
    }

    private MockMultipartFile image() throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(128, 64, BufferedImage.TYPE_INT_RGB), "png", out);
        return new MockMultipartFile("avatar", "../../unexpected.png", "image/png", out.toByteArray());
    }
}
