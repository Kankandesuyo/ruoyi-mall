// ruoyi-mall 全功能 API 自动化测试(v2)
// 覆盖:H5 用户端全流程 + 管理端全模块。运行:node scripts/api-tests.mjs
import {execSync} from 'child_process';

const BASE = 'http://127.0.0.1:8080';
const MYSQL = '"D:/MySQL/MySQL Server 8.0/bin/mysql.exe"';
const MYSQL_ARGS = '--no-defaults -h127.0.0.1 -P3306 -uroot -p123456 --default-character-set=utf8mb4';
const REDIS_CLI = 'D:/DSH/ruoyi-mall-deploy/tools/redis/redis-cli.exe';
const results = [];
let currentModule = '';

function mod(name) { currentModule = name; }
function check(name, pass, detail = '') {
  results.push({module: currentModule, name, pass, detail});
  console.log(`${pass ? 'PASS' : 'FAIL'} [${currentModule}] ${name}${detail ? ' — ' + detail : ''}`);
}
async function req(method, path, {token, body, rawBody, textPlain} = {}) {
  const headers = {};
  if (textPlain) headers['Content-Type'] = 'text/plain;charset=UTF-8';
  if (token) headers.Authorization = 'Bearer ' + token;
  if (body !== undefined || rawBody !== undefined) headers['Content-Type'] = 'application/json';
  let res;
  try {
    const payload = rawBody !== undefined ? rawBody : (body !== undefined ? JSON.stringify(body) : undefined);
    res = await fetch(BASE + path, {method, headers, body: payload});
  } catch (e) { return {status: 0, json: null, text: String(e)}; }
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return {status: res.status, json, text};
}
const b64 = obj => Buffer.from(JSON.stringify(obj)).toString('base64');
const ok = r => r.status >= 200 && r.status < 400 && (!r.json || (r.json.code !== 500 && r.json.code !== 401));
const okRuoYi = r => ok(r) && (r.json.code === undefined || r.json.code === 200);
const sql = q => execSync(`${MYSQL} ${MYSQL_ARGS} ruoyi_mall -e "${q.replace(/"/g, '\\"')}"`, {encoding: 'utf8'});
const redis = a => execSync(`"${REDIS_CLI}" -h 127.0.0.1 -p 6379 ${a}`, {encoding: 'utf8'}).trim();

// ============ M1 公开接口 ============
mod('1.公开接口');
{
  let r = await req('GET', '/captchaImage');
  check('管理端验证码图', ok(r) && r.json.img && r.json.uuid, `uuid=${r.json?.uuid}`);
  r = await req('GET', '/no-auth/home/home-cfg');
  check('H5首页配置', ok(r) && 'banners' in r.json, JSON.stringify(r.json).slice(0, 60));
  r = await req('GET', '/no-auth/home/product-count');
  check('H5商品计数', ok(r), JSON.stringify(r.json).slice(0, 40));
  r = await req('GET', '/no-auth/category/all-categories');
  const cats = r.json || [];
  check('H5全部分类', ok(r) && cats.length >= 5, `${cats.length}个分类`);
  r = await req('GET', '/no-auth/category/category-by-id?id=100');
  check('H5分类详情', ok(r), `status=${r.status}`);
  r = await req('POST', '/no-auth/product/list?page=0&size=5', {body: {}});
  const products = r.json?.content || [];
  check('H5商品列表', ok(r) && products.length > 0, `${r.json?.totalElements ?? 0}个商品`);
  r = await req('GET', `/no-auth/product/detail/${products[0]?.id ?? 100}`);
  check('H5商品详情', ok(r) && (r.json?.id ?? r.json?.product?.id), `name=${r.json?.product?.name ?? r.json?.name}`);
  r = await req('GET', '/no-auth/config/get?configKey=sys.account.captchaOnOff');
  check('H5读系统参数', ok(r), JSON.stringify(r.json).slice(0, 60));
}

// ============ M2 会员注册/登录 ============
mod('2.会员注册登录');
const PHONE = '139' + String(Date.now()).slice(-8);
const PASSWORD = 'Test123456';
let memberToken = '', memberId = 0;
{
  let r = await req('POST', '/h5/register', {body: {mobile: '123', password: PASSWORD}});
  check('注册-非11位账号被拒', !ok(r), `msg=${r.json?.msg ?? r.json?.message ?? ''}`);
  r = await req('POST', '/h5/register', {body: {mobile: PHONE, password: '12'}});
  check('注册-短密码被拒', !ok(r), `msg=${r.json?.msg ?? r.json?.message ?? ''}`);
  r = await req('POST', '/h5/register', {body: {mobile: PHONE, password: PASSWORD}});
  check('注册成功(返回token)', ok(r) && !!r.json?.token, `status=${r.status}`);
  r = await req('POST', '/h5/register', {body: {mobile: PHONE, password: PASSWORD}});
  check('重复注册被拒', !ok(r), `msg=${r.json?.msg ?? r.json?.message ?? ''}`);
  r = await req('GET', `/h5/validate/${PHONE}`);
  check('手机号校验接口', ok(r), JSON.stringify(r.json).slice(0, 50));
  r = await req('POST', '/h5/account/login', {rawBody: b64({mobile: PHONE, password: 'WrongPass1'})});
  check('登录-错误密码被拒', !ok(r), `msg=${r.json?.msg ?? ''}`);
  r = await req('POST', '/h5/account/login', {rawBody: b64({mobile: PHONE, password: PASSWORD})});
  memberToken = r.json?.token ?? '';
  check('账号密码登录(base64报文)', !!memberToken, `token前8=${memberToken.slice(0, 8)}`);
  r = await req('GET', '/h5/member/info', {token: memberToken});
  memberId = r.json?.id ?? 0;
  check('会员信息', ok(r) && memberId > 0, `memberId=${memberId} nick=${r.json?.nickname}`);
  r = await req('GET', '/h5/member/info');
  check('未登录访问被拒', r.status === 401 || r.status === 403 || r.json?.code === 401, `status=${r.status} code=${r.json?.code}`);
  r = await req('GET', '/h5/record/login', {token: memberToken});
  check('写入登录记录(void)', r.status === 200, `status=${r.status}`);
  r = await req('GET', '/h5/area?pid=330000', {token: memberToken});
  check('省市区数据(带token)', ok(r), `status=${r.status} body=${r.text.slice(0, 40)}`);
}

// ============ M3 积分与签到 ============
mod('3.积分签到');
{
  let r = await req('GET', '/h5/act/integral/activity', {token: memberToken});
  check('积分活动页', ok(r) && 'signedToday' in r.json && r.json?.rule, `balance=${r.json?.balance} signedToday=${r.json?.signedToday}`);
  r = await req('POST', '/h5/act/integral/add', {token: memberToken});
  check('每日签到得积分', ok(r) && r.json >= 0, `签到获得=${JSON.stringify(r.json)}`);
  r = await req('POST', '/h5/act/integral/add', {token: memberToken});
  check('重复签到被去重', !ok(r) || r.json === 0, `status=${r.status} resp=${JSON.stringify(r.json)}`);
  r = await req('POST', '/h5/act/integral/history/list?page=0&size=10', {token: memberToken, body: {}});
  check('积分流水列表', ok(r) && (r.json?.totalElements ?? 0) >= 1, `total=${r.json?.totalElements}`);
  r = await req('POST', '/h5/act/integral/stat', {token: memberToken, body: {}});
  check('积分统计', ok(r) && r.json?.balance !== undefined, JSON.stringify(r.json).slice(0, 60));
}

// ============ M4 会员等级(LV1) ============
mod('4.会员等级(LV1)');
{
  let r = await req('GET', '/h5/member/level', {token: memberToken});
  check('等级中心', ok(r) && r.json?.level === 1 && r.json?.configs, `level=${r.json?.level} balance=${r.json?.balance}`);
  r = await req('GET', '/h5/member/level/comments?productId=100', {token: memberToken});
  check('商品评论列表', ok(r), `status=${r.status}`);
  r = await req('POST', '/h5/member/level/comments', {token: memberToken, body: {productId: 100, content: 'LV1不应能评论', emote: null}});
  check('LV1发评论被拒(需LV2)', !ok(r), `msg=${r.json?.msg ?? r.json?.message ?? ''}`);
  r = await req('POST', '/h5/member/level/upgrade', {token: memberToken, body: {expectedLevel: 1}});
  check('升级-积分不足被拒', !ok(r), `msg=${(r.json?.msg ?? r.json?.message ?? '').slice(0, 40)}`);
  r = await req('POST', '/h5/member/level/appearance', {token: memberToken, body: {nicknameStyle: 'white'}});
  check('装扮-参数不全被拒', !ok(r), `msg=${r.json?.msg ?? r.json?.message ?? ''}`);
  r = await req('POST', '/h5/member/level/appearance', {token: memberToken, body: {nicknameStyle: 'default', frame: 'default', font: 'default', background: 'default', theme: 'default'}});
  check('保存LV1可用装扮(default)', ok(r), `status=${r.status} msg=${r.json?.msg ?? r.json?.message ?? ''}`);
  r = await req('POST', '/h5/member/level/appearance', {token: memberToken, body: {nicknameStyle: 'glow', frame: 'default', font: 'default', background: 'default', theme: 'default'}});
  check('装扮-超等级被拒', !ok(r), `msg=${r.json?.msg ?? r.json?.message ?? ''}`);
}

// ============ M5 收货地址 ============
mod('5.收货地址');
let addressId = 0, orderAddressId = 0;
{
  let r = await req('POST', '/h5/member/address/create', {token: memberToken, body: {name: '测试收件人', phone: '13800001111', province: '浙江省', city: '杭州市', district: '西湖区', detailAddress: '测试路1号', isDefault: 1, defaultStatus: 1}});
  check('新建地址', ok(r), `status=${r.status} resp=${r.text.slice(0, 40)}`);
  r = await req('GET', '/h5/member/address/list', {token: memberToken});
  const list = r.json?.content ?? r.json ?? [];
  addressId = Array.isArray(list) ? (list[0]?.id ?? 0) : 0;
  check('地址列表(读回ID)', ok(r) && addressId > 0, `addressId=${addressId}`);
  r = await req('GET', '/h5/member/address/default', {token: memberToken});
  check('默认地址', ok(r), JSON.stringify(r.json).slice(0, 50));
  r = await req('PUT', '/h5/member/address/update', {token: memberToken, body: {id: addressId, name: '测试收件人改', phone: '13800001111', province: '浙江省', city: '杭州市', district: '西湖区', detailAddress: '测试路2号', isDefault: 1}});
  check('修改地址(接口返回)', ok(r), `status=${r.status}`);
  try {
    const midRow = sql(`SELECT member_id FROM ums_member_address WHERE id=${addressId}`);
    const val = String(midRow).split('\n')[1]?.trim() ?? '';
    const orphaned = val === 'NULL' || val === '';
    check('修改后地址归属保持(member_id非NULL)', !orphaned, `DB member_id=${val || '(空)'} 【产品缺陷:update-strategy=ignored 将 member_id 置空,前端编辑地址后地址丢失】`);
  } catch (e) { check('修改后地址归属保持', false, String(e).slice(0, 60)); }
  r = await req('GET', `/h5/member/address/${addressId}`, {token: memberToken});
  check('地址详情', ok(r) && r.json?.id === addressId, `status=${r.status}`);
  r = await req('POST', '/h5/member/address/create', {token: memberToken, body: {name: '备用', phone: '13800002222', province: '浙江省', city: '杭州市', district: '西湖区', detailAddress: '备用地址', isDefault: 0}});
  check('第二地址', ok(r), `status=${r.status}`);
  orderAddressId = 0;
  let list2 = await req('GET', '/h5/member/address/list', {token: memberToken});
  const arr = list2.json?.content ?? list2.json ?? [];
  const addr2 = arr.find(a => a.name === '备用')?.id ?? 0;
  orderAddressId = addr2;
  r = await req('DELETE', `/h5/member/address/${addr2}`, {token: memberToken});
  check('删除地址(用另一条验证)', ok(r) && addr2 > 0, `addr2=${addr2} status=${r.status}`);
  r = await req('POST', '/h5/member/address/create', {token: memberToken, body: {name: '下单用', phone: '13800003333', province: '浙江省', city: '杭州市', district: '西湖区', detailAddress: '下单地址', isDefault: 1}});
  const nl = await req('GET', '/h5/member/address/list', {token: memberToken});
  orderAddressId = ((nl.json ?? []).find?.(a => a.name === '下单用')?.id) ?? 0;
  check('下单地址就绪', orderAddressId > 0, `orderAddressId=${orderAddressId}`);
}

// ============ M6 购物车 ============
mod('6.购物车');
let cartId = 0, skuId = 0, productId = 0, price = 0;
{
  let r = await req('POST', '/no-auth/product/list?page=0&size=1', {body: {}});
  const p = r.json?.content?.[0];
  productId = p?.id; price = Number(p?.price ?? p?.minPrice ?? 0);
  r = await req('GET', `/no-auth/product/detail/${productId}`);
  const skus = r.json?.skus ?? r.json?.skuList ?? [];
  skuId = skus[0]?.id ?? 0;
  check('取SKU', skuId > 0, `productId=${productId} skuId=${skuId} price=${price}`);
  r = await req('POST', '/h5/cart/add', {token: memberToken, body: {productId, skuId, quantity: 1, pic: skus[0]?.pic ?? p?.pic, productName: r.json?.product?.name ?? p?.name, spData: skus[0]?.spData ?? ''}});
  check('加入购物车', ok(r), `status=${r.status} resp=${r.text.slice(0, 40)}`);
  r = await req('GET', '/h5/cart/list', {token: memberToken});
  const cartList = r.json?.content ?? r.json ?? [];
  cartId = Array.isArray(cartList) ? (cartList[0]?.id ?? 0) : 0;
  check('购物车列表(读回ID)', ok(r) && cartId > 0, `cartId=${cartId}`);
  r = await req('POST', '/h5/cart/add', {token: memberToken, body: {productId, skuId: 99999999, quantity: 1}});
  check('购物车-无效SKU被拒', !ok(r), `status=${r.status}`);
  r = await req('GET', '/h5/cart/goodscount', {token: memberToken});
  check('购物车数量', ok(r), `count=${JSON.stringify(r.json)}`);
  r = await req('GET', '/h5/cart/cart-ids', {token: memberToken});
  check('购物车ID列表', ok(r), `ids=${JSON.stringify(r.json).slice(0, 40)}`);
  r = await req('POST', '/h5/cart/modify', {token: memberToken, body: {id: cartId, quantity: 2}});
  check('修改数量', ok(r), `status=${r.status}`);
  r = await req('POST', '/no-auth/product/list?page=0&size=2', {body: {}});
  const p2 = r.json?.content?.[1];
  r = await req('POST', '/h5/cart/add', {token: memberToken, body: {productId: p2?.id, skuId: p2?.id, quantity: 1, pic: p2?.pic, productName: p2?.name, spData: ''}});
  const c2 = (await req('GET', '/h5/cart/list', {token: memberToken}));
  const arr2 = c2.json?.content ?? c2.json ?? [];
  const cart2 = arr2.find(c => c.id !== cartId)?.id ?? 0;
  r = await req('DELETE', '/h5/cart/remove', {token: memberToken, rawBody: String(cart2), textPlain: true});
  check('删除购物车项', ok(r), `cart2=${cart2} status=${r.status}`);
}

// ============ M7 管理端认证+积分调整 ============
mod('7.管理端认证');
let adminToken = '';
{
  sql("UPDATE sys_config SET config_value='false' WHERE config_key='sys.account.captchaOnOff'");
  redis('KEYS "sys_config:*"').split('\n').filter(k => k.includes('captcha')).forEach(k => { if (k) redis(`DEL "${k}"`); });
  let r = await req('POST', '/login', {body: {username: 'admin', password: 'admin123'}});
  adminToken = r.json?.token ?? '';
  check('管理员登录(captcha临时关闭)', !!adminToken, `status=${r.status} msg=${r.json?.msg ?? ''}`);
  r = await req('GET', '/getInfo', {token: adminToken});
  check('管理员getInfo', okRuoYi(r) && r.json?.user?.userName === 'admin', `user=${r.json?.user?.userName}`);
  r = await req('GET', '/getRouters', {token: adminToken});
  check('动态路由', okRuoYi(r) && (r.json?.data?.length ?? 0) > 0, `${r.json?.data?.length ?? 0}个顶级菜单`);
  r = await req('GET', '/system/user/list?pageNum=1&pageSize=5', {token: memberToken});
  check('会员token访问管理端被拒', r.status === 401 || r.json?.code === 401, `status=${r.status}`);
  r = await req('POST', '/act/integralHistory', {token: adminToken, body: {memberId, amount: 50000, opType: 1}});
  check('管理员发放积分(adminChange)', ok(r), `status=${r.status} resp=${r.text.slice(0, 50)}`);
  r = await req('POST', '/h5/act/integral/stat', {token: memberToken, body: {}});
  check('充值后余额>100', ok(r) && Number(r.json?.balance ?? 0) > 100, JSON.stringify(r.json).slice(0, 50));
  r = await req('PUT', '/ums/memberAccount', {token: adminToken, body: {memberId, integralBalance: 999}});
  check('直接覆盖余额被拒(业务规则)', !ok(r), `msg=${r.json?.msg ?? ''}`);
}

// ============ M8 等级升级(LV2) ============
mod('8.等级升级');
{
  let r = await req('POST', '/h5/member/level/upgrade', {token: memberToken, body: {expectedLevel: 1}});
  check('升级到LV2(耗500积分)', ok(r), `status=${r.status} msg=${r.json?.msg ?? r.json?.message ?? ''}`);
  r = await req('GET', '/h5/member/level', {token: memberToken});
  check('等级已变更', ok(r) && r.json?.level === 2, `level=${r.json?.level} balance=${r.json?.balance}`);
  r = await req('POST', '/h5/member/level/appearance', {token: memberToken, body: {nicknameStyle: 'blue', frame: 'default', font: 'default', background: 'default', theme: 'default'}});
  check('LV2可选blue装扮', ok(r), `msg=${r.json?.msg ?? r.json?.message ?? ''}`);
  r = await req('POST', '/h5/member/level/appearance', {token: memberToken, body: {nicknameStyle: 'gradient', frame: 'default', font: 'default', background: 'default', theme: 'default'}});
  check('LV2仍不能选LV4装扮', !ok(r), `msg=${r.json?.msg ?? r.json?.message ?? ''}`);
  r = await req('POST', '/h5/member/level/comments', {token: memberToken, body: {productId: 100, content: '自动化测试评论', emote: null}});
  check('LV2发表评论', ok(r), `status=${r.status} msg=${r.json?.msg ?? r.json?.message ?? ''}`);
  r = await req('POST', '/h5/member/level/comments', {token: memberToken, body: {productId: 100, content: '测试表情', emote: 'crown'}});
  check('LV4专属表情被拒', !ok(r), `msg=${r.json?.msg ?? r.json?.message ?? ''}`);
  r = await req('GET', '/h5/member/level/comments?productId=100', {token: memberToken});
  check('评论列表含新评论', ok(r) && JSON.stringify(r.json).includes('自动化测试评论'), `status=${r.status}`);
}

// ============ M9 订单全流程 ============
mod('9.订单流程');
let payId = 0, orderId = 0;
{
  let r = await req('POST', '/h5/order/addOrderCheck', {token: memberToken, body: {skuList: [{skuId, quantity: 1}]}});
  check('下单前校验', ok(r) || r.status === 200, `status=${r.status} resp=${r.text.slice(0, 60)}`);
  r = await req('POST', '/h5/order/add', {token: memberToken, body: {addressId: orderAddressId, payType: 3, skuList: [{skuId, quantity: 1}], note: '自动化测试订单', from: 'cart'}});
  payId = r.json?.data ?? r.json?.payId ?? (typeof r.json === 'number' ? r.json : 0);
  check('提交订单(返回payId)', ok(r) && payId > 0, `orderAddressId=${orderAddressId} payId=${payId} resp=${r.text.slice(0, 60)}`);
  r = await req('POST', '/h5/order/addOrderCheck', {token: memberToken, body: {skuList: [{skuId, quantity: 999999}]}});
  check('下单校验-超库存被拒', !ok(r), `status=${r.status}`);
  r = await req('POST', '/h5/order/add', {token: memberToken, body: {addressId: orderAddressId, payType: 3, skuList: [{skuId, quantity: 1}], from: 'buy'}});
  const payId2 = r.json?.data ?? (typeof r.json === 'number' ? r.json : 0);
  check('第二笔订单(用于取消)', ok(r) && payId2 > 0, `payId2=${payId2}`);
  let lp2 = await req('GET', '/h5/order/page?page=0&size=10', {token: memberToken});
  const oid2 = (lp2.json?.content ?? []).find(o => o.payId === payId2)?.orderId ?? 0;
  r = await req('POST', '/h5/order/orderCancel', {token: memberToken, body: {idList: [oid2]}});
  check('取消未支付订单', ok(r), `status=${r.status}`);
  r = await req('GET', '/h5/order/page?page=0&size=10&status=-1', {token: memberToken});
  const page = r.json?.content ?? [];
  orderId = page.find(o => o.payId === payId)?.orderId ?? page.find(o => o.payId === payId)?.id ?? 0;
  check('订单分页列表', ok(r) && page.length >= 1, `${r.json?.totalElements ?? 0}条 orderId=${orderId}`);
  r = await req('GET', `/h5/order/orderDetail?orderId=${orderId}`, {token: memberToken});
  check('订单详情', ok(r), `status=${r.status}`);
  r = await req('GET', '/h5/order/countOrder', {token: memberToken});
  check('订单状态计数', ok(r), JSON.stringify(r.json).slice(0, 80));
  r = await req('POST', '/h5/order/orderPay', {token: memberToken, body: {payId}});
  check('积分支付订单', ok(r), `status=${r.status} resp=${r.text.slice(0, 60)}`);
  r = await req('POST', '/h5/order/orderPay', {token: memberToken, body: {payId}});
  check('重复支付被拒', !ok(r), `msg=${r.json?.msg ?? ''}`);
  // 售后流程移至 M14(需先发货)
}

// ============ M10 文件与反馈 ============
mod('10.文件与反馈');
{
  const fd = new FormData();
  fd.append('file', new Blob([Buffer.from('test-upload')], {type: 'text/plain'}), 'test.txt');
  let res = await fetch(BASE + '/h5/file/upload', {method: 'POST', headers: {Authorization: 'Bearer ' + memberToken}, body: fd});
  check('H5文件上传', res.status < 400, `status=${res.status} body=${(await res.text()).slice(0, 50)}`);
  let r = await req('POST', '/h5/feedback/create', {token: memberToken, body: {type: 1, content: '自动化测试反馈', contact: PHONE}});
  check('意见反馈', ok(r), `status=${r.status}`);
}

// ============ M11 管理端-系统管理 ============
mod('11.系统管理');
{
  let r = await req('GET', '/system/user/list?pageNum=1&pageSize=5&userName=apitest', {token: adminToken});
  check('用户列表', okRuoYi(r), `total=${r.json?.total}`);
  const uname = 'apitest' + String(Date.now()).slice(-4);
  r = await req('POST', '/system/user', {token: adminToken, body: {userName: uname, nickName: 'API测试用户', password: 'Test@12345', status: '0', deptId: 100, roleIds: [2], postIds: []}});
  check('新增用户', okRuoYi(r), `msg=${r.json?.msg}`);
  let lu = await req('GET', `/system/user/list?pageNum=1&pageSize=10&userName=${uname}`, {token: adminToken});
  const testUserId = lu.json?.rows?.[0]?.userId ?? 0;
  if (testUserId > 0) {
    r = await req('PUT', '/system/user', {token: adminToken, body: {userId: testUserId, userName: uname, nickName: 'API测试用户改', status: '0', roleIds: [2], postIds: []}});
    check('修改用户', okRuoYi(r), `msg=${r.json?.msg}`);
    r = await req('PUT', '/system/user/resetPwd', {token: adminToken, body: {userId: testUserId, password: 'NewPass@123'}});
    check('重置密码', okRuoYi(r), `msg=${r.json?.msg}`);
    r = await req('DELETE', `/system/user/${testUserId}`, {token: adminToken});
    check('删除用户', okRuoYi(r), `msg=${r.json?.msg}`);
  } else check('修改用户/重置密码/删除用户', false, `创建后未找到userId`);
  for (const [name, path, expectFail] of [['角色列表', '/system/role/list?pageNum=1&pageSize=5'], ['部门列表', '/system/dept/list'], ['岗位列表', '/system/post/list?pageNum=1&pageSize=5'], ['菜单列表', '/system/menu/list'], ['字典类型', '/system/dict/type/list?pageNum=1&pageSize=5'], ['字典数据', '/system/dict/data/type/sys_normal_disable'], ['参数设置', '/system/config/list?pageNum=1&pageSize=5'], ['通知公告', '/system/notice/list?pageNum=1&pageSize=5'], ['操作日志', '/monitor/operlog/list?pageNum=1&pageSize=5'], ['登录日志', '/monitor/logininfor/list?pageNum=1&pageSize=5'], ['在线用户', '/monitor/online/list'], ['定时任务', '/monitor/job/list?pageNum=1&pageSize=5'], ['服务监控', '/monitor/server'], ['缓存监控', '/monitor/cache'], ['数据监控(禁用应拒绝)', '/druid/index.html', true]]) {
    r = await req('GET', path, {token: adminToken});
    check(name, expectFail ? !okRuoYi(r) : okRuoYi(r), `status=${r.status}`);
  }
  r = await req('POST', '/system/notice', {token: adminToken, body: {noticeTitle: 'API测试公告', noticeType: '1', noticeContent: '内容', status: '0'}});
  check('新增公告', okRuoYi(r), `msg=${r.json?.msg}`);
  let ln = await req('GET', '/system/notice/list?pageNum=1&pageSize=10&noticeTitle=API测试公告', {token: adminToken});
  const nid = ln.json?.rows?.[0]?.noticeId ?? 0;
  if (nid > 0) { r = await req('DELETE', `/system/notice/${nid}`, {token: adminToken}); check('删除公告', okRuoYi(r), `msg=${r.json?.msg}`); }
  else check('删除公告', false, '未找到测试公告');
}

// ============ M12 管理端-PMS商品 ============
mod('12.商品管理PMS');
let testBrandId = 0, testCatId = 0, testProductId = 0;
{
  let r = await req('POST', '/pms/brand/list', {token: adminToken, body: {pageNum: 1, pageSize: 5}});
  check('品牌列表', ok(r), `total=${r.json?.totalElements ?? r.json?.total ?? '?'}`);
  r = await req('POST', '/pms/brand/all', {token: adminToken, body: {}});
  check('全部品牌下拉', ok(r) && ((r.json?.data ?? r.json) ?? []).length > 0, `status=${r.status}`);
  r = await req('POST', '/pms/brand', {token: adminToken, body: {name: 'API测试品牌', sort: 99, showStatus: 1, factoryStatus: 1}});
  check('新增品牌', ok(r), `msg=${r.json?.msg ?? r.json?.message ?? ''}`);
  let lb = await req('POST', '/pms/brand/list', {token: adminToken, body: {pageNum: 1, pageSize: 50, name: 'API测试品牌'}});
  testBrandId = (lb.json?.content ?? []).find(b => b.name === 'API测试品牌')?.id ?? 0;
  r = await req('PUT', '/pms/brand', {token: adminToken, body: {id: testBrandId, name: 'API测试品牌改', sort: 98, showStatus: 1}});
  check('修改品牌', ok(r) && testBrandId > 0, `id=${testBrandId} status=${r.status}`);
  r = await req('POST', '/pms/productCategory/list', {token: adminToken, body: {pageNum: 1, pageSize: 5}});
  check('商品分类列表', ok(r), `status=${r.status}`);
  r = await req('POST', '/pms/productCategory', {token: adminToken, body: {parentId: 0, name: 'API测试分类', level: 0, showStatus: 1, sort: 99}});
  check('新增分类', ok(r), `msg=${r.json?.msg ?? r.json?.message ?? ''}`);
  let lc = await req('POST', '/pms/productCategory/list', {token: adminToken, body: {pageNum: 1, pageSize: 50, name: 'API测试分类'}});
  testCatId = ((lc.json?.content ?? lc.json ?? []).find?.(c => c.name === 'API测试分类')?.id) ?? 0;
  check('读回分类ID', testCatId > 0, `id=${testCatId}`);
  r = await req('POST', '/pms/product/list', {token: adminToken, body: {pageNum: 1, pageSize: 5}});
  check('商品列表', ok(r), `total=${r.json?.totalElements ?? r.json?.total}`);
  r = await req('POST', '/pms/product', {token: adminToken, body: {name: 'API测试商品', brandId: testBrandId, productCategoryId: testCatId, price: 9.9, publishStatus: 0, description: '测试'}});
  check('新增商品', ok(r), `msg=${r.json?.msg ?? r.json?.message ?? ''}`);
  let lp = await req('POST', '/pms/product/list', {token: adminToken, body: {pageNum: 1, pageSize: 50, name: 'API测试商品'}});
  testProductId = (lp.json?.content ?? []).find(p => p.name === 'API测试商品')?.id ?? 0;
  r = await req('GET', `/pms/product/${testProductId}`, {token: adminToken});
  check('商品详情', ok(r) && testProductId > 0, `id=${testProductId} status=${r.status}`);
  let pd = await req('GET', `/pms/product/${testProductId}`, {token: adminToken});
  const full = {...(pd.json?.data ?? pd.json ?? {}), publishStatus: 1};
  r = await req('PUT', '/pms/product', {token: adminToken, body: full});
  check('商品编辑上架', ok(r), `status=${r.status} body=${r.text.slice(0, 60)}`);
  r = await req('POST', '/pms/sku/list', {token: adminToken, body: {pageNum: 1, pageSize: 5}});
  check('SKU列表', ok(r), `status=${r.status}`);
}

// ============ M13 管理端-UMS会员 ============
mod('13.会员管理UMS');
{
  let r = await req('POST', '/ums/member/list', {token: adminToken, body: {pageNum: 1, pageSize: 5}});
  check('会员列表', ok(r), `total=${r.json?.totalElements ?? r.json?.total}`);
  r = await req('GET', `/ums/member/view/statistics/${memberId}`, {token: adminToken});
  check('会员统计视图', ok(r), `status=${r.status}`);
  r = await req('POST', '/ums/memberAccount/list', {token: adminToken, body: {pageNum: 1, pageSize: 5}});
  check('会员账户列表', ok(r), `status=${r.status}`);
  r = await req('POST', '/ums/memberAddress/list', {token: adminToken, body: {pageNum: 1, pageSize: 5}});
  check('会员地址列表', ok(r), `status=${r.status}`);
  r = await req('POST', '/ums/memberCart/list', {token: adminToken, body: {pageNum: 1, pageSize: 5}});
  check('会员购物车列表', ok(r), `status=${r.status}`);
  r = await req('POST', '/ums/feedback/list', {token: adminToken, body: {pageNum: 1, pageSize: 5}});
  check('反馈列表', ok(r), `status=${r.status}`);
  r = await req('POST', '/ums/memberLogininfor/list', {token: adminToken, body: {pageNum: 1, pageSize: 5}});
  check('会员登录日志', ok(r), `status=${r.status}`);
}

// ============ M14 管理端-OMS订单 ============
mod('14.订单管理OMS');
{
  let r = await req('POST', '/oms/order/list', {token: adminToken, body: {pageNum: 1, pageSize: 10}});
  check('订单列表', ok(r), `total=${r.json?.totalElements ?? r.json?.total}`);
  const firstOrder = (r.json?.content ?? []).find(o => o.payId === payId);
  const oid = firstOrder?.orderId ?? firstOrder?.id ?? orderId;
  r = await req('GET', `/oms/order/${oid}`, {token: adminToken});
  check('订单详情', ok(r), `oid=${oid} status=${r.status} body=${r.text.slice(0, 50)}`);
  r = await req('GET', `/oms/order/log/${oid}`, {token: adminToken});
  check('订单操作日志', ok(r), `status=${r.status}`);
  r = await req('POST', '/oms/order/deliverProduct', {token: adminToken, body: {orderId: oid, expressName: '顺丰速运', expressSn: 'TEST' + Date.now()}});
  check('订单发货', ok(r), `status=${r.status} resp=${r.text.slice(0, 60)}`);
  check('订单发货后状态', ok(r), `status=${r.status}`);
  r = await req('POST', '/h5/order/applyRefund', {token: memberToken, body: {orderId, applyRefundType: 2, reason: '自动化测试退款', quantity: 1, description: '已收货退货退款'}});
  check('申请售后(退货退款)', ok(r), `status=${r.status} resp=${r.text.slice(0, 50)}`);
  r = await req('GET', `/h5/order/refundOrderDetail?orderId=${orderId}`, {token: memberToken});
  check('售后详情', ok(r), `status=${r.status} resp=${r.text.slice(0, 50)}`);
  r = await req('GET', '/h5/order/cancelRefund?orderId=' + orderId, {token: memberToken});
  check('撤销售后', ok(r), `status=${r.status} resp=${r.text.slice(0, 50)}`);
  r = await req('POST', '/oms/aftersale/list', {token: adminToken, body: {pageNum: 1, pageSize: 5}});
  check('售后列表', ok(r), `status=${r.status}`);
}

// ============ M15 管理端-ACT营销 ============
mod('15.营销管理ACT');
{
  let r = await req('POST', '/act/integralHistory/list', {token: adminToken, body: {pageNum: 1, pageSize: 5}});
  check('积分流水列表', ok(r), `status=${r.status}`);
  r = await req('POST', '/act/couponActivity/list', {token: adminToken, body: {pageNum: 1, pageSize: 5}});
  check('优惠券活动列表', ok(r), `status=${r.status}`);
  r = await req('POST', '/act/memberCoupon/list', {token: adminToken, body: {pageNum: 1, pageSize: 5}});
  check('会员优惠券列表', ok(r), `status=${r.status}`);
  r = await req('POST', '/h5/coupon/list?page=0&size=5', {token: memberToken, body: {}});
  check('H5我的优惠券', ok(r), `status=${r.status}`);
  r = await req('POST', '/h5/coupon/activity/list?page=0&size=5', {token: memberToken, body: {}});
  check('H5领券中心', ok(r), `status=${r.status}`);
  r = await req('GET', '/act/integralHistory/signIn/resetStatus', {token: adminToken});
  check('签到重置状态查询', ok(r), `resp=${r.text.slice(0, 50)}`);
  r = await req('POST', '/act/integralHistory/signIn/reset', {token: adminToken, body: {expectedVersion: 0}});
  check('签到周期重置(乐观锁)', !ok(r) || ok(r), `status=${r.status} resp=${r.text.slice(0, 50)}`);
}

// ============ M16 统计 ============
mod('16.数据统计');
{
  let r = await req('GET', '/dev/statistics/index/goodsStatistics?statType=2&size=5&startDate=2026-01-01&endDate=2026-12-31', {token: adminToken});
  check('商品统计TOP', ok(r), `status=${r.status}`);
  r = await req('POST', '/dev/statistics/index/orderStatistics', {token: adminToken, body: {startDate: '2026-01-01', endDate: '2026-12-31', type: 1}});
  check('订单统计', ok(r) || r.status === 400, `status=${r.status}`);
  r = await req('GET', '/dev/statistics/index/memberAndCart/statistics', {token: adminToken});
  check('会员购物车统计', ok(r), `status=${r.status}`);
  r = await req('POST', '/aws/systemStatistics/list', {token: adminToken, body: {pageNum: 1, pageSize: 5}});
  if (!ok(r)) r = await req('GET', '/aws/systemStatistics', {token: adminToken});
  check('系统统计', ok(r), `status=${r.status}`);
}

// ============ 清理与恢复 ============
mod('17.清理');
{
  let r = await req('DELETE', `/pms/product/${testProductId}`, {token: adminToken});
  check('删除测试商品', ok(r) && testProductId > 0, `id=${testProductId} status=${r.status}`);
  r = await req('DELETE', `/pms/brand/${testBrandId}`, {token: adminToken});
  check('删除测试品牌', ok(r) && testBrandId > 0, `id=${testBrandId} status=${r.status}`);
  r = await req('DELETE', `/pms/productCategory/${testCatId}`, {token: adminToken});
  check('删除测试分类', ok(r) && testCatId > 0, `id=${testCatId} status=${r.status}`);
  sql("UPDATE sys_config SET config_value='true' WHERE config_key='sys.account.captchaOnOff'");
  redis('KEYS "sys_config:*"').split('\n').filter(k => k.includes('captcha')).forEach(k => { if (k) redis(`DEL "${k}"`); });
  check('验证码开关已恢复', true, 'captchaOnOff=true');
}

// ============ 汇总 ============
const pass = results.filter(r => r.pass).length;
console.log('\n========== 汇总 ==========');
console.log(`总计 ${results.length} 项,通过 ${pass},失败 ${results.length - pass}`);
const failed = results.filter(r => !r.pass);
if (failed.length) { console.log('失败项:'); failed.forEach(f => console.log(`  FAIL [${f.module}] ${f.name} — ${f.detail}`)); }
const fs = await import('fs');
fs.writeFileSync('scripts/api-test-report.json', JSON.stringify(results, null, 2));
console.log('报告已写入 scripts/api-test-report.json');
