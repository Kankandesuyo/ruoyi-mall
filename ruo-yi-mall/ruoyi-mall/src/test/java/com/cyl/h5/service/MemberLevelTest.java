package com.cyl.h5.service;
import com.cyl.manager.ums.mapper.*;
import com.cyl.manager.ums.domain.entity.*;
import com.cyl.manager.act.service.IntegralHistoryService;
import org.junit.jupiter.api.*;
import org.springframework.test.util.ReflectionTestUtils;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
class MemberLevelTest {
 private UserLevelMapper mapper;
 private IntegralHistoryService points;
 private H5LevelService service;
 @BeforeEach void setup(){
  mapper=mock(UserLevelMapper.class); points=new IntegralHistoryService();
  ReflectionTestUtils.setField(points,"levelMapper",mapper);
  service=new H5LevelService(); ReflectionTestUtils.setField(service,"levels",mapper);
  ReflectionTestUtils.setField(service,"accounts",mock(MemberAccountMapper.class));
  ReflectionTestUtils.setField(service,"points",mock(IntegralHistoryService.class));
 }
 @Test void allMultipliersAndFractionalRounding(){
  String[] multipliers={"1.00","1.10","1.15","1.20","1.25"};
  int[] rewards={100,110,115,120,125};
  for(int i=0;i<5;i++){
   UserLevelConfig c=new UserLevelConfig();c.setPointMultiplier(new BigDecimal(multipliers[i]));
   when(mapper.config(i+1)).thenReturn(c);
   assertEquals(new BigDecimal(rewards[i]),points.calculatePointReward(new BigDecimal("100"),i+1));
  }
  assertEquals(new BigDecimal("1"),points.calculatePointReward(new BigDecimal("1.5"),5));
  assertThrows(IllegalArgumentException.class,()->points.calculatePointReward(new BigDecimal("-1"),1));
 }
 @Test void duplicateOrForgedUpgradeRejected(){
  when(mapper.lockedLevel(7L)).thenReturn(2);
  assertThrows(IllegalArgumentException.class,()->service.upgrade(7L,1));
  verify(mapper,never()).upgrade(anyLong(),anyInt(),anyInt());
 }
 @Test void highestLevelCannotUpgrade(){
  when(mapper.lockedLevel(7L)).thenReturn(5);
  assertThrows(IllegalArgumentException.class,()->service.upgrade(7L,5));
 }
 @Test void levelOneCannotComment(){
  when(mapper.lockedLevel(7L)).thenReturn(1);
  assertThrows(IllegalArgumentException.class,()->service.comment(7L,1L,"评论",null));
  verify(mapper,never()).comment(anyLong(),anyLong(),anyString(),any());
 }
 @Test void levelTwoCannotForgeExclusiveEmote(){
  when(mapper.lockedLevel(7L)).thenReturn(2);
  assertThrows(IllegalArgumentException.class,()->service.comment(7L,1L,"评论","star"));
  verify(mapper,never()).comment(anyLong(),anyLong(),anyString(),any());
 }
 @Test void allExclusiveStickersRequireLevelFour(){
  when(mapper.productExists(1L)).thenReturn(1);
  when(mapper.comment(anyLong(),anyLong(),anyString(),anyString())).thenReturn(1);
  for(String code:Arrays.asList("star","heart","fire","crown")) {
   when(mapper.lockedLevel(7L)).thenReturn(3);
   assertThrows(IllegalArgumentException.class,()->service.comment(7L,1L,"评论",code));
   when(mapper.lockedLevel(7L)).thenReturn(4);
   assertDoesNotThrow(()->service.comment(7L,1L,"评论",code));
  }
  assertThrows(IllegalArgumentException.class,()->service.comment(7L,1L,"评论","unknown"));
 }
 @Test void lockedAppearanceCannotBeForged(){
  when(mapper.lockedLevel(7L)).thenReturn(1);
  Map<String,String> choices=new HashMap<>();
  H5LevelService.OPTIONS.keySet().forEach(k->choices.put(k,"default"));choices.put("frame","gold");
  assertThrows(IllegalArgumentException.class,()->service.appearance(7L,choices));
  verify(mapper,never()).saveAppearance(anyLong(),anyMap());
 }
}
