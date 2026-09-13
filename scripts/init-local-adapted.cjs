// Adapted from scripts/init-local.cjs for this machine:
// - MySQL 8.0 service already running on 127.0.0.1:3306 (root auth via CLI arg)
// - Does NOT alter the root password (shared local instance)
// - Writes application-local.yml pointing at 3306 and local Redis 6379
const fs = require('fs');
const {spawnSync} = require('child_process');
const {randomBytes} = require('crypto');
const path = require('path');
const root = path.resolve(__dirname, '..');
process.chdir(root);
if (fs.existsSync('.runtime/initialized')) throw Error('Already initialized; refusing to overwrite data');

const MYSQL = process.env.MYSQL_CLIENT || 'D:/MySQL/MySQL Server 8.0/bin/mysql.exe';
const ROOT_PASSWORD = process.env.MYSQL_ROOT_PASSWORD;
if (!ROOT_PASSWORD) throw Error('Set MYSQL_ROOT_PASSWORD env var');

const addressSql = fs.readFileSync('ruo-yi-mall/sql/address.sql', 'utf8')
  .split('\n')
  .filter(line => !line.startsWith('INSERT INTO `address`') || /VALUES \(\d+, (33|330100|330106),/.test(line))
  .join('\n');
const sql = `CREATE DATABASE IF NOT EXISTS ruoyi_mall CHARACTER SET utf8mb4; USE ruoyi_mall;\n`
  + fs.readFileSync('ruo-yi-mall/sql/数据和结构.sql', 'utf8') + '\n'
  + fs.readFileSync('ruo-yi-mall/sql/member-level.sql', 'utf8') + '\n'
  + fs.readFileSync('ruo-yi-mall/sql/sign-in-reset.sql', 'utf8') + '\n'
  + addressSql + '\n'
  + `CREATE USER IF NOT EXISTS 'mall'@'127.0.0.1' IDENTIFIED BY '${process.env.MALL_PASSWORD}'; `
  + `GRANT ALL ON ruoyi_mall.* TO 'mall'@'127.0.0.1'; FLUSH PRIVILEGES;`;

const r = spawnSync(MYSQL, ['--no-defaults', '-h127.0.0.1', '-P3306', '-uroot', `-p${ROOT_PASSWORD}`, '--default-character-set=utf8mb4'], {input: sql, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024});
if (r.status !== 0) throw Error(r.stderr);
if (r.stderr && /ERROR/.test(r.stderr)) throw Error(r.stderr);

fs.writeFileSync('.runtime/application-local.yml', `server:
  address: 127.0.0.1
spring:
  datasource:
    druid:
      master:
        url: jdbc:mysql://127.0.0.1:3306/ruoyi_mall?useUnicode=true&characterEncoding=utf8&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai&rewriteBatchedStatements=true
        username: mall
        password: ${process.env.MALL_PASSWORD}
      statViewServlet:
        enabled: false
  redis:
    host: 127.0.0.1
    port: 6379
    database: 0
    password: ''
ruoyi:
  profile: D:/DSH/ruoyi-mall/.runtime/uploads
  demoEnabled: false
  addressEnabled: false
logging:
  level:
    com.cyl.h5.service.H5MemberService: ERROR
token:
  secret: ${randomBytes(32).toString('hex')}
sms:
  enabled: false
wechat:
  enabled: false
scheduling:
  enabled: false
`);
fs.writeFileSync('.runtime/mysql-client.ini', `[client]\nhost=127.0.0.1\nport=3306\nuser=mall\npassword=${process.env.MALL_PASSWORD}\ndefault-character-set=utf8mb4\n`);
fs.writeFileSync('.runtime/initialized', new Date().toISOString());
console.log('Database ruoyi_mall imported; .runtime/application-local.yml generated.');
