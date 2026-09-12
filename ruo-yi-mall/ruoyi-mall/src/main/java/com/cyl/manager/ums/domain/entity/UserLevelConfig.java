package com.cyl.manager.ums.domain.entity;
import java.math.BigDecimal;
import lombok.Data;
@Data
public class UserLevelConfig {
 private Integer level;
 private String levelName;
 private BigDecimal upgradeCost;
 private BigDecimal pointMultiplier;
 private String description;
}
