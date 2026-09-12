package com.cyl.h5.domain.form;

import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;

@Data
public class RegisterForm {

    @ApiModelProperty("11位数字账号")
    @NotBlank
    private String mobile;

    @ApiModelProperty("密码")
    @NotBlank
    private String password;

}
