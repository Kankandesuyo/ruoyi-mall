import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../src/utils/contract.js', import.meta.url), 'utf8')
const { encodeLogin, normalizeResponse, addressPayload, safeRedirect, validSkuList } =
  await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))

test('会员登录正文是 UTF-8 JSON 的 Base64，保留非 ASCII 密码', () => {
  const form = { mobile: '13800000000', password: '测试%密码' }
  assert.deepEqual(JSON.parse(Buffer.from(encodeLogin(form), 'base64').toString('utf8')), form)
})

test('兼容 Spring Page、若依 rows 和原始标量，不把业务错误当成功', () => {
  assert.deepEqual(normalizeResponse({ content: [1], totalElements: 21, number: 1, size: 10 }).data,
    { records: [1], total: 21, page: 1, size: 10 })
  assert.deepEqual(normalizeResponse({ code: 200, rows: [1], total: 21 }).data, { records: [1], total: 21 })
  assert.equal(normalizeResponse(3).data, 3)
  assert.equal(normalizeResponse(null).data, null)
  assert.equal(normalizeResponse({ code: 401, msg: 'expired' }).code, 401)
})

test('地址提交 isDefault 且不提交会员归属字段', () => {
  const result = addressPayload({ id: 1, name: '收货人', defaultStatus: 1, memberId: 999 })
  assert.equal(result.isDefault, 1)
  assert.equal(result.memberId, undefined)
  assert.equal(result.defaultStatus, undefined)
  assert.equal(addressPayload({}).isDefault, 0)
})

test('登录回跳保留合法路由编码，拒绝站外地址和登录循环', () => {
  assert.equal(safeRedirect('/goods?keyword=100%25'), '/goods?keyword=100%25')
  for (const value of ['//example.com', 'https://example.com', '/\\example.com', '/login', null, ['/cart']]) {
    assert.equal(safeRedirect(value), '/home')
  }
})

test('结算拒绝损坏缓存、无效 SKU 和非正整数数量', () => {
  assert.equal(validSkuList([{ skuId: '10', quantity: 2 }]), true)
  for (const items of [null, {}, [], { length: 2 }, [null], [{ skuId: NaN, quantity: 1 }],
    [{ skuId: 1, quantity: 0 }], [{ skuId: 1, quantity: -1 }], [{ skuId: 1, quantity: 1.5 }]]) {
    assert.equal(validSkuList(items), false)
  }
})
