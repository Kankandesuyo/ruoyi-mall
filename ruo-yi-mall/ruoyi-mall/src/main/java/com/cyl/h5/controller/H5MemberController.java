package com.cyl.h5.controller;

import com.cyl.h5.domain.form.RegisterForm;
import com.cyl.h5.domain.vo.H5LoginVO;
import com.cyl.h5.domain.vo.RegisterVO;
import com.cyl.h5.domain.vo.ValidatePhoneVO;
import com.cyl.h5.domain.vo.WechatLoginVO;
import com.cyl.h5.service.H5MemberService;
import com.cyl.h5.service.H5MemberProfileService;
import com.cyl.manager.ums.domain.vo.MemberVO;
import com.ruoyi.common.core.domain.model.LoginMember;
import com.ruoyi.framework.web.service.TokenService;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.ruoyi.common.exception.ServiceException;
import java.io.IOException;

import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/h5")
public class H5MemberController {

    @Autowired
    private H5MemberService service;
    @Autowired
    private TokenService tokenService;
    @Autowired
    private H5MemberProfileService profileService;

    @ApiOperation("修改自己的用户名和头像")
    @PostMapping(value = "/member/profile", consumes = "multipart/form-data")
    public ResponseEntity<MemberVO> updateProfile(HttpServletRequest request,
            @RequestParam String nickname,
            @RequestParam(required = false) MultipartFile avatar) throws IOException {
        LoginMember loginMember = tokenService.getLoginMember(request);
        if (loginMember == null) throw new ServiceException("请先登录", 401);
        return ResponseEntity.ok(profileService.update(loginMember.getMemberId(), nickname, avatar));
    }


    @ApiOperation("会员注册")
    @PostMapping("/register")
    public ResponseEntity<RegisterVO> register(@RequestBody RegisterForm request){
        return ResponseEntity.ok(service.register(request));
    }

    @ApiOperation("注册登录验证码校验手机号")
    @GetMapping("/validate/{phone}")
    public ResponseEntity<ValidatePhoneVO> validate(@PathVariable String phone){
        return ResponseEntity.ok(service.validate(phone));
    }

    @ApiOperation("手机号密码登录")
    @PostMapping("/account/login")
    public ResponseEntity<H5LoginVO> accountLogin(@RequestBody String data){
        return ResponseEntity.ok(service.accountLogin(data));
    }

    @PostMapping("/wechat/login")
    public ResponseEntity<H5LoginVO> wechatLogin(String data) throws Exception {
        if (StringUtils.isEmpty(data)) {
            return ResponseEntity.ok(null);
        }
        WechatLoginVO params = H5MemberService.parseLoginBody(data, WechatLoginVO.class);
        return ResponseEntity.ok(service.wechatLogin(params));
    }

    @ApiOperation("sms登录")
    @PostMapping("/sms/login")
    public ResponseEntity<H5LoginVO> smsLogin(@RequestBody String data){
        return ResponseEntity.ok(service.smsLogin(data));
    }

    @ApiOperation("获取会员信息")
    @GetMapping("/member/info")
    public ResponseEntity<MemberVO> getMemberInfo(){
        return ResponseEntity.ok(service.getMemberInfo());
    }

    @ApiOperation("设置会员微信信息")
    @PostMapping("/member/setWechatInfo")
    public void setWechatInfo(@RequestBody String data){
        service.setWechatInfo(data);
    }

    @ApiOperation("新增会员登录记录")
    @GetMapping("/record/login")
    public void add(HttpServletRequest request) {
        LoginMember loginMember = tokenService.getLoginMember(request);
        if (loginMember != null){
            service.insert(loginMember.getMemberId());
        }
    }
}
