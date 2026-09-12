package com.cyl.h5.controller;
import com.cyl.h5.config.SecurityUtil;
import com.cyl.h5.service.H5LevelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.*;
import lombok.Data;
@RestController
@RequestMapping("/h5/member/level")
public class H5LevelController {
 @Autowired private H5LevelService service;
 @Data public static class Upgrade { private Integer expectedLevel; }
 @Data public static class Comment { private Long productId; private String content; private String emote; }
 private Long id(){return SecurityUtil.getLocalMember().getId();}
 @GetMapping public ResponseEntity<?> center(){return ResponseEntity.ok(service.center(id()));}
 @PostMapping("/upgrade") public ResponseEntity<?> upgrade(@RequestBody Upgrade body){return ResponseEntity.ok(service.upgrade(id(),body.getExpectedLevel()));}
 @PostMapping("/appearance") public ResponseEntity<?> appearance(@RequestBody Map<String,String> body){return ResponseEntity.ok(service.appearance(id(),body));}
 @GetMapping("/comments") public ResponseEntity<?> comments(@RequestParam Long productId,@RequestParam(defaultValue="0") long after){return ResponseEntity.ok(service.comments(productId,after));}
 @PostMapping("/comments") public ResponseEntity<?> comment(@RequestBody Comment body){service.comment(id(),body.getProductId(),body.getContent(),body.getEmote());return ResponseEntity.ok().build();}
}
