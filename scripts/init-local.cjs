const fs = require('fs');
const {spawnSync} = require('child_process');
const {randomBytes} = require('crypto');
const path = require('path');
const root = path.resolve(__dirname, '..');
process.chdir(root);
if(fs.existsSync('.runtime/initialized')) throw Error('Already initialized; refusing to overwrite data');
const password=randomBytes(24).toString('hex');
const rootPassword=randomBytes(32).toString('hex');
const sql = `CREATE DATABASE ruoyi_mall CHARACTER SET utf8mb4; USE ruoyi_mall;\n` + fs.readFileSync('ruo-yi-mall/sql/数据和结构.sql','utf8') + '\n' + fs.readFileSync('ruo-yi-mall/sql/member-level.sql','utf8') + '\n' + fs.readFileSync('ruo-yi-mall/sql/sign-in-reset.sql','utf8') + '\n' + fs.readFileSync('ruo-yi-mall/sql/address.sql','utf8').split('\n').filter(line => !line.startsWith('INSERT INTO `address`') || /VALUES \(\d+, (33|330100|330106),/.test(line)).join('\n') + `\nCREATE USER 'mall'@'127.0.0.1' IDENTIFIED BY '${password}'; GRANT ALL ON ruoyi_mall.* TO 'mall'@'127.0.0.1'; ALTER USER 'root'@'localhost' IDENTIFIED BY '${rootPassword}';`;
const r=spawnSync('C:/Program Files/MySQL/MySQL Server 8.4/bin/mysql.exe',['--no-defaults','-h127.0.0.1','-P3308','-uroot','--default-character-set=utf8mb4'],{input:sql,encoding:'utf8',maxBuffer:10*1024*1024});
if(r.status!==0) throw Error(r.stderr);
fs.writeFileSync('.runtime/application-local.yml',`server:
  address: 127.0.0.1
spring:
  datasource:
    druid:
      master:
        url: jdbc:mysql://127.0.0.1:3308/ruoyi_mall?useUnicode=true&characterEncoding=utf8&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai&rewriteBatchedStatements=true
        username: mall
        password: ${password}
      statViewServlet:
        enabled: false
  redis:
    host: 127.0.0.1
    port: 6390
    database: 0
    password: ''
ruoyi:
  profile: E:/ruoyi2/.runtime/uploads
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
fs.writeFileSync('.runtime/mysql-client.ini',`[client]\nhost=127.0.0.1\nport=3308\nuser=mall\npassword=${password}\ndefault-character-set=utf8mb4\n`);
fs.writeFileSync('.runtime/mysql-admin.ini', `[client]\nhost=127.0.0.1\nport=3308\nuser=root\npassword=${rootPassword}\n`);
fs.writeFileSync('.runtime/initialized',new Date().toISOString());
console.log('Isolated database imported; local configuration generated.');

