// H5MemberService.accountLogin reads raw Base64 containing UTF-8 JSON.
export function encodeLogin(data) {
  return btoa(Array.from(new TextEncoder().encode(JSON.stringify(data)), byte => String.fromCharCode(byte)).join(''))
}

export function normalizeResponse(payload) {
  const res = payload && typeof payload === 'object' && Object.hasOwn(payload, 'code')
    ? { ...payload } : { code: 200, data: payload }
  if (Number(res.code) !== 200) return res
  if (Array.isArray(res.rows)) {
    res.data = { records: res.rows, total: res.total }
  } else if (Array.isArray(res.data?.content)) {
    const page = res.data
    res.data = { records: page.content, total: page.totalElements, page: page.number, size: page.size }
  }
  return res
}

export function addressPayload(data) {
  const { id, name, phone, province, city, district, detailAddress, postCode } = data
  return { id, name, phone, province, city, district, detailAddress, postCode,
    isDefault: Number(data.isDefault ?? data.defaultStatus ?? 0) === 1 ? 1 : 0 }
}

export function safeRedirect(value) {
  return typeof value === 'string' && /^\/(?!\/)/.test(value) && !/[\\\u0000-\u001f]/.test(value)
    && !value.startsWith('/login') ? value : '/home'
}

export function validSkuList(items) {
  return Array.isArray(items) && items.length > 0 && items.every(item => item &&
    /^[1-9]\d*$/.test(String(item.skuId)) && Number.isSafeInteger(item.quantity) && item.quantity > 0)
}
