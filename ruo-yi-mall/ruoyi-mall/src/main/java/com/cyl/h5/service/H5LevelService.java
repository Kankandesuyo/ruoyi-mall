package com.cyl.h5.service;
import com.cyl.manager.ums.mapper.*;
import com.cyl.manager.ums.domain.entity.*;
import com.cyl.manager.act.service.IntegralHistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service
@Transactional(rollbackFor=Exception.class)
public class H5LevelService {
 @Autowired private UserLevelMapper levels;
 @Autowired private MemberMapper members;
 @Autowired private MemberAccountMapper accounts;
 @Autowired private IntegralHistoryService points;
 public static final Map<String,Map<String,Integer>> OPTIONS = new LinkedHashMap<>();
 static {
  option("nicknameStyle", "default",1,"white",2,"blue",2,"green",2,"purple",2,"rose",3,"amber",3,"gradient",4,"glow",5);
  option("frame","default",1,"silver",3,"aurora",4,"gold",5);
  option("font","default",1,"serif",3,"rounded",4);
  option("background","default",1,"ocean",4,"forest",4);
  option("theme","default",1,"ocean",4,"forest",4);
 }
 private static void option(String category,Object... values) {
  Map<String,Integer> map=new LinkedHashMap<>();
  for(int i=0;i<values.length;i+=2) map.put((String)values[i],(Integer)values[i+1]);
  OPTIONS.put(category,Collections.unmodifiableMap(map));
 }
 public Map<String,Object> identity(Long id) {
  Member m=members.selectById(id);
  if(m==null) throw new IllegalArgumentException("用户不存在");
  int level=m.getLevel();
  Map<String,Object> result=new LinkedHashMap<>();
  result.put("nickname",m.getNickname()); result.put("avatar",m.getAvatar()); result.put("level",level);
  Map<String,Object> saved=levels.appearance(id), appearance=new LinkedHashMap<>();
  OPTIONS.forEach((k,v)-> { String choice=saved==null?"default":String.valueOf(saved.get(k));
   appearance.put(k,v.getOrDefault(choice,99)<=level?choice:"default"); });
  result.put("appearance",appearance);
  return result;
 }
 public Map<String,Object> center(Long id) {
  accounts.ensureAccount(id); MemberAccount account=accounts.lockAccount(id);
  Map<String,Object> result=identity(id); int level=(Integer)result.get("level");
  result.put("balance",account.getIntegralBalance()); result.put("current",levels.config(level));
  result.put("next",level==5?null:levels.config(level+1)); result.put("configs",levels.configs()); result.put("options",OPTIONS);
  return result;
 }
 public Map<String,Object> upgrade(Long id,Integer expectedLevel) {
  accounts.ensureAccount(id); accounts.lockAccount(id);
  Integer current=levels.lockedLevel(id);
  if(current==null || current<1 || current>5) throw new IllegalArgumentException("用户等级数据无效");
  if(current==5) throw new IllegalArgumentException("当前已达到最高等级");
  if(!current.equals(expectedLevel)) throw new IllegalArgumentException("等级已变更，请刷新后重新确认");
  UserLevelConfig next=levels.config(current+1);
  if(next==null || next.getUpgradeCost().signum()<=0) throw new IllegalArgumentException("等级配置无效");
  points.consumePoints(id,next.getUpgradeCost(),"LEVEL_UPGRADE",23,null);
  if(levels.upgrade(id,current,current+1)!=1 || levels.history(id,current,current+1,next.getUpgradeCost())!=1)
   throw new IllegalStateException("等级升级失败");
  return center(id);
 }
 public Map<String,Object> appearance(Long id,Map<String,String> choices) {
  accounts.ensureAccount(id); accounts.lockAccount(id); int level=levels.lockedLevel(id);
  if(!OPTIONS.keySet().equals(choices.keySet())) throw new IllegalArgumentException("外观参数无效");
  OPTIONS.forEach((key,allowed)-> {
   if(allowed.getOrDefault(choices.get(key),99)>level) throw new IllegalArgumentException("尚未解锁此外观");
  });
  if(levels.saveAppearance(id,choices)<1) throw new IllegalStateException("外观保存失败");
  return center(id);
 }
 public List<Map<String,Object>> comments(Long product,long after) {
  List<Map<String,Object>> rows=levels.comments(product,Math.max(0,after));
  for(Map<String,Object> row:rows) row.put("user",identity(((Number)row.remove("memberId")).longValue()));
  return rows;
 }
 public void comment(Long id,Long product,String content,String emote) {
  accounts.ensureAccount(id); accounts.lockAccount(id);
  int level = levels.lockedLevel(id);
  if(emote != null && (!Arrays.asList("star", "heart", "fire", "crown").contains(emote) || level < 4)) throw new IllegalArgumentException("专属表情需要 LV4");
  if(level<2) throw new IllegalArgumentException("发表评论需要 LV2");
  if(content==null || content.trim().isEmpty() || content.length()>500 || content.matches("(?s).*[\\p{Cntrl}&&[^\\n\\t]].*")) throw new IllegalArgumentException("评论须为1至500字");
  if(levels.productExists(product)!=1) throw new IllegalArgumentException("商品不存在或已下架");
  if(levels.recentComments(id)>0) throw new IllegalArgumentException("评论过于频繁，请30秒后重试");
  if(levels.comment(id,product,content.trim(),emote)!=1) throw new IllegalStateException("评论保存失败");
 }
}
