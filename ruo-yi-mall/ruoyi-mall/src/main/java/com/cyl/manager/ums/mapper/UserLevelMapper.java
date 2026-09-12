package com.cyl.manager.ums.mapper;
import com.cyl.manager.ums.domain.entity.UserLevelConfig;
import org.apache.ibatis.annotations.*;
import java.util.*;
import java.math.BigDecimal;
public interface UserLevelMapper {
 @Select("SELECT * FROM user_level_config ORDER BY level") List<UserLevelConfig> configs();
 @Select("SELECT * FROM user_level_config WHERE level=#{level}") UserLevelConfig config(int level);
 @Select("SELECT level FROM ums_member WHERE id=#{id} FOR UPDATE") Integer lockedLevel(Long id);
 @Update("UPDATE ums_member SET level=#{next} WHERE id=#{id} AND level=#{previous}")
 int upgrade(@Param("id") Long id,@Param("previous") int previous,@Param("next") int next);
 @Insert("INSERT INTO user_level_history(member_id,from_level,to_level,cost_points,create_time) VALUES(#{id},#{previous},#{next},#{cost},NOW())")
 int history(@Param("id") Long id,@Param("previous") int previous,@Param("next") int next,@Param("cost") BigDecimal cost);
 @Select("SELECT nickname_style AS nicknameStyle,frame,font,background,theme FROM user_appearance WHERE member_id=#{id}") Map<String,Object> appearance(Long id);
 @Insert("INSERT INTO user_appearance(member_id,nickname_style,frame,font,background,theme) VALUES(#{id},#{a.nicknameStyle},#{a.frame},#{a.font},#{a.background},#{a.theme}) ON DUPLICATE KEY UPDATE nickname_style=VALUES(nickname_style),frame=VALUES(frame),font=VALUES(font),background=VALUES(background),theme=VALUES(theme)")
 int saveAppearance(@Param("id") Long id,@Param("a") Map<String,String> a);
 @Select("SELECT c.id,c.content,c.emote,c.create_time AS createTime,c.member_id AS memberId FROM product_comment c WHERE product_id=#{product} AND c.id>#{after} ORDER BY c.id LIMIT 20")
 List<Map<String,Object>> comments(@Param("product") Long product,@Param("after") long after);
 @Select("SELECT COUNT(*) FROM pms_product WHERE id=#{id} AND publish_status=1") int productExists(Long id);
 @Select("SELECT COUNT(*) FROM product_comment WHERE member_id=#{id} AND create_time > DATE_SUB(NOW(), INTERVAL 30 SECOND)") int recentComments(Long id);
 @Insert("INSERT INTO product_comment(member_id,product_id,content,emote,create_time) VALUES(#{id},#{product},#{content},#{emote},NOW())")
 int comment(@Param("id") Long id,@Param("product") Long product,@Param("content") String content,@Param("emote") String emote);
}
