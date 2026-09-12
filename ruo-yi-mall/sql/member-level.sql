-- Apply once after backing up the database. Existing balances and ledger rows are preserved.
ALTER TABLE ums_member MODIFY level TINYINT UNSIGNED NOT NULL DEFAULT 1;
UPDATE ums_member SET level=1 WHERE level=0;
CREATE TABLE user_level_config (
 level INT PRIMARY KEY, level_name VARCHAR(30) NOT NULL, upgrade_cost DECIMAL(12,2) NOT NULL,
 point_multiplier DECIMAL(4,2) NOT NULL, description VARCHAR(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO user_level_config VALUES
(1,'新用户',0,1.00,'购买商品、基础主页、积分任务'),
(2,'活跃用户',500,1.10,'发表评论、等级徽章、基础昵称颜色'),
(3,'资深用户',1500,1.15,'初级头像框、更多昵称颜色、特殊字体、评论徽章'),
(4,'核心用户',5000,1.20,'中级头像框、主页背景、主题、专属表情、评论装饰、渐变昵称'),
(5,'荣誉用户',10000,1.25,'荣誉徽章、高级头像框、昵称特效、主页铭牌、年度活跃标识');
CREATE TABLE user_level_history (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, member_id BIGINT NOT NULL, from_level INT NOT NULL,
 to_level INT NOT NULL, cost_points DECIMAL(12,2) NOT NULL, create_time DATETIME NOT NULL,
 UNIQUE KEY uk_member_level(member_id,to_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
ALTER TABLE act_integral_history ADD before_points DECIMAL(12,2) NULL,
 ADD after_points DECIMAL(12,2) NULL, ADD source VARCHAR(32) NULL, ADD description VARCHAR(200) NULL;
CREATE TABLE user_appearance (
 member_id BIGINT PRIMARY KEY, nickname_style VARCHAR(30) NOT NULL DEFAULT 'default',
 frame VARCHAR(30) NOT NULL DEFAULT 'default', font VARCHAR(30) NOT NULL DEFAULT 'default',
 background VARCHAR(30) NOT NULL DEFAULT 'default', theme VARCHAR(30) NOT NULL DEFAULT 'default'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE product_comment (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, member_id BIGINT NOT NULL, product_id BIGINT NOT NULL,
 content VARCHAR(500) NOT NULL, emote VARCHAR(20) NULL, create_time DATETIME NOT NULL,
 KEY idx_product_time(product_id,id), KEY idx_member_time(member_id,create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
