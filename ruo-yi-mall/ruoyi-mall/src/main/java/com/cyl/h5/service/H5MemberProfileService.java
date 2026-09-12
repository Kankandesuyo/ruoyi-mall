package com.cyl.h5.service;

import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.cyl.manager.ums.domain.entity.Member;
import com.cyl.manager.ums.domain.vo.MemberVO;
import com.cyl.manager.ums.mapper.MemberMapper;
import com.ruoyi.common.config.RuoYiConfig;
import com.ruoyi.common.constant.Constants;
import com.ruoyi.common.exception.ServiceException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Iterator;
import java.util.Locale;
import java.util.UUID;

/** Only the authenticated member's display fields can be changed. */
@Service
public class H5MemberProfileService {
    @Autowired
    private MemberMapper memberMapper;

    @Transactional(rollbackFor = Exception.class)
    public MemberVO update(Long authenticatedId, String nickname, MultipartFile avatar) throws IOException {
        Member member = authenticatedId == null ? null : memberMapper.selectById(authenticatedId);
        if (member == null || !Constants.MEMBER_ACCOUNT_STATUS.NORMAL.equals(member.getStatus())) {
            throw new ServiceException("请先登录", 401);
        }
        String name = nickname == null ? "" : nickname.trim();
        if (name.isEmpty() || name.length() > 30 || name.codePoints().anyMatch(Character::isISOControl)) {
            throw new IllegalArgumentException("用户名须为1至30个字符，不能包含控制字符");
        }
        String avatarUrl = member.getAvatar();
        Path saved = null;
        try {
            if (avatar != null) {
                BufferedImage image = readAvatar(avatar);
                Path directory = Paths.get(RuoYiConfig.getAvatarPath(), "member");
                Files.createDirectories(directory);
                String filename = UUID.randomUUID().toString() + ".png";
                saved = directory.resolve(filename);
                if (!ImageIO.write(image, "png", saved.toFile())) throw new IOException("头像保存失败");
                avatarUrl = Constants.RESOURCE_PREFIX + "/avatar/member/" + filename;
                final Path created = saved;
                // A failed database commit must not leave an uploaded orphan.
                if (TransactionSynchronizationManager.isSynchronizationActive()) {
                    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                        @Override public void afterCompletion(int status) {
                            if (status != STATUS_COMMITTED) {
                                try { Files.deleteIfExists(created); } catch (IOException ignored) { }
                            }
                        }
                    });
                }
            }
            UpdateWrapper<Member> update = new UpdateWrapper<Member>()
                    .eq("id", authenticatedId)
                    .set("nickname", name)
                    .set("update_time", LocalDateTime.now());
            if (saved != null) update.set("avatar", avatarUrl);
            if (memberMapper.update(null, update) != 1) throw new IllegalStateException("保存失败，请重试");
            MemberVO result = new MemberVO();
            result.setId(authenticatedId);
            result.setNickname(name);
            result.setAvatar(avatarUrl);
            return result;
        } catch (IOException | RuntimeException ex) {
            if (saved != null) Files.deleteIfExists(saved);
            throw ex;
        }
    }

    private BufferedImage readAvatar(MultipartFile file) throws IOException {
        if (file.isEmpty() || file.getSize() > 2 * 1024 * 1024) {
            throw new IllegalArgumentException("头像不能为空且不能超过2MB");
        }
        try (InputStream input = file.getInputStream();
             ImageInputStream stream = ImageIO.createImageInputStream(input)) {
            if (stream == null) throw new IllegalArgumentException("请选择有效的JPG或PNG图片");
            Iterator<ImageReader> readers = ImageIO.getImageReaders(stream);
            if (!readers.hasNext()) throw new IllegalArgumentException("请选择有效的JPG或PNG图片");
            ImageReader reader = readers.next();
            try {
                String format = reader.getFormatName().toLowerCase(Locale.ROOT);
                if (!format.equals("jpeg") && !format.equals("png")) {
                    throw new IllegalArgumentException("头像仅支持JPG或PNG图片");
                }
                reader.setInput(stream, true, true);
                int width = reader.getWidth(0), height = reader.getHeight(0);
                if (width < 1 || height < 1 || width > 4096 || height > 4096) {
                    throw new IllegalArgumentException("图片宽高不能超过4096像素");
                }
                BufferedImage source = reader.read(0);
                int side = Math.min(width, height);
                int size = Math.min(side, 512);
                BufferedImage output = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
                Graphics2D graphics = output.createGraphics();
                try {
                    graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
                    int x = (width - side) / 2, y = (height - side) / 2;
                    graphics.drawImage(source, 0, 0, size, size, x, y, x + side, y + side, null);
                } finally { graphics.dispose(); }
                return output;
            } finally { reader.dispose(); }
        } catch (IOException ex) {
            throw new IllegalArgumentException("图片损坏或无法读取，请重新选择", ex);
        }
    }
}
