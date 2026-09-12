package com.cyl.manager.act.controller;

import com.cyl.manager.act.convert.IntegralHistoryConvert;
import com.cyl.manager.act.domain.entity.IntegralHistory;
import com.cyl.manager.act.domain.query.IntegralHistoryQuery;
import com.cyl.manager.act.domain.vo.IntegralHistoryVO;
import com.cyl.manager.act.service.IntegralHistoryService;
import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.utils.poi.ExcelUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
/**
 * 积分流水表Controller
 * 
 * @author zcc
 * @date 2024-03-01
 */
@Api(description ="积分流水表接口列表")
@RestController
@RequestMapping("/act/integralHistory")
public class IntegralHistoryController extends BaseController {
    @Autowired
    private IntegralHistoryService service;
    @Autowired
    private IntegralHistoryConvert convert;

    @GetMapping("/signIn/resetStatus")
    @PreAuthorize("@ss.hasPermi('system:config:edit')")
    public ResponseEntity<?> signInResetStatus() {
        return ResponseEntity.ok(service.signInResetStatus());
    }

    @lombok.Data
    public static class SignInResetRequest {
        private Long expectedVersion;
    }

    @PostMapping("/signIn/reset")
    @PreAuthorize("@ss.hasPermi('system:config:edit')")
    @Log(title = "重置所有会员今日签到", businessType = BusinessType.UPDATE)
    public ResponseEntity<?> resetTodaySignIn(@RequestBody SignInResetRequest request) {
        service.resetTodaySignIn(request.getExpectedVersion());
        return ResponseEntity.ok().build();
    }

    @ApiOperation("查询积分流水表列表")
    @PreAuthorize("@ss.hasPermi('act:integralHistory:list')")
    @PostMapping("/list")
    public ResponseEntity<Page<IntegralHistory>> list(@RequestBody IntegralHistoryQuery query, Pageable page) {
        List<IntegralHistory> list = service.selectList(query, page);
        return ResponseEntity.ok(new PageImpl<>(list, page, ((com.github.pagehelper.Page)list).getTotal()));
    }

    @ApiOperation("导出积分流水表列表")
    @PreAuthorize("@ss.hasPermi('act:integralHistory:export')")
    @Log(title = "积分流水表", businessType = BusinessType.EXPORT)
    @GetMapping("/export")
    public ResponseEntity<String> export(IntegralHistoryQuery query) {
        List<IntegralHistory> list = service.selectList(query, null);
        ExcelUtil<IntegralHistoryVO> util = new ExcelUtil<>(IntegralHistoryVO.class);
        return ResponseEntity.ok(util.writeExcel(convert.dos2vos(list), "积分流水表数据"));
    }

    @ApiOperation("获取积分流水表详细信息")
    @PreAuthorize("@ss.hasPermi('act:integralHistory:query')")
    @GetMapping(value = "/{id}")
    public ResponseEntity<IntegralHistory> getInfo(@PathVariable("id") Long id) {
        return ResponseEntity.ok(service.selectById(id));
    }

    @ApiOperation("新增积分流水表")
    @PreAuthorize("@ss.hasPermi('act:integralHistory:add')")
    @Log(title = "积分流水表", businessType = BusinessType.INSERT)
    @PostMapping
    public ResponseEntity<Integer> add(@RequestBody IntegralHistory integralHistory) {
        return ResponseEntity.ok(service.adminChange(integralHistory));
    }

    @ApiOperation("修改积分流水表")
    @PreAuthorize("@ss.hasPermi('act:integralHistory:edit')")
    @Log(title = "积分流水表", businessType = BusinessType.UPDATE)
    @PutMapping
    public ResponseEntity<Integer> edit(@RequestBody IntegralHistory integralHistory) {
        return ResponseEntity.ok(service.update(integralHistory));
    }

    @ApiOperation("删除积分流水表")
    @PreAuthorize("@ss.hasPermi('act:integralHistory:remove')")
    @Log(title = "积分流水表", businessType = BusinessType.DELETE)
	@DeleteMapping("/{id}")
    public ResponseEntity<Integer> remove(@PathVariable Long id) {
        return ResponseEntity.ok(service.deleteById(id));
    }
}
