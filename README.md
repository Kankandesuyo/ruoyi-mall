# 若依积分商城

本仓库统一保存后端、管理端和 H5 用户端源码，基于 https://github.com/chenge26696/fw111 的项目继续开发。

| 目录 | 用途 |
| --- | --- |
| `ruo-yi-mall/` | Java / Spring Boot 后端、数据库结构及迁移脚本 |
| `ruoyi-mall-vue/` | Vue 管理端，管理商品、订单和积分规则 |
| `ruoyi-mall-h5/` | Vue 3 用户端，提供购物、会员、签到和积分支付页面 |
| `scripts/` | Windows 本地启动与演示商品初始化脚本 |

本地脚本包含本机软件路径，其他电脑使用前需要调整 Java、MySQL、Redis 路径，并准备本地数据库与配置。`.runtime/` 中的数据库、密码、上传文件及日志不随源码提交。仓库中的默认配置仅用于开发示例，部署前需替换数据库密码和令牌密钥，并核查登录、权限及外部服务配置。

验证命令：H5 目录执行 `npm test` 和 `npm run build`；管理端目录执行 `npm run build:prod`，旧版 Webpack 在新版 Node.js 下需要 `NODE_OPTIONS=--openssl-legacy-provider`。

以下保留原项目说明。

#### 介绍
作业

#### 软件架构
软件架构说明


#### 安装教程

1.  xxxx
2.  xxxx
3.  xxxx

#### 使用说明

1.  xxxx
2.  xxxx
3.  xxxx

#### 参与贡献

1.  Fork 本仓库
2.  新建 Feat_xxx 分支
3.  提交代码
4.  新建 Pull Request


#### 特技

1.  使用 Readme\_XXX.md 来支持不同的语言，例如 Readme\_en.md, Readme\_zh.md
2.  Gitee 官方博客 [blog.gitee.com](https://blog.gitee.com)
3.  你可以 [https://gitee.com/explore](https://gitee.com/explore) 这个地址来了解 Gitee 上的优秀开源项目
4.  [GVP](https://gitee.com/gvp) 全称是 Gitee 最有价值开源项目，是综合评定出的优秀开源项目
5.  Gitee 官方提供的使用手册 [https://gitee.com/help](https://gitee.com/help)
6.  Gitee 封面人物是一档用来展示 Gitee 会员风采的栏目 [https://gitee.com/gitee-stars/](https://gitee.com/gitee-stars/)
