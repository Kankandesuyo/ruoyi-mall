import request from '@/utils/request'

// 使用会员购物车列表计算角标，避免 goodscount 使用管理端身份和 COUNT(quantity)。
export function count() {
  return request({
    url: '/h5/cart/list',
    method: 'get'
  }).then(res => ({ ...res, data: (res.data || []).filter(item => item.status !== 0 && item.skuIfExist !== 0).reduce((sum, item) => sum + Number(item.quantity || 0), 0) }))
}

// 购物车列表
export function list() {
  return request({
    url: '/h5/cart/list',
    method: 'get'
  })
}

// 加入购物车
export function add(data) {
  return request({
    url: '/h5/cart/add',
    method: 'post',
    data
  })
}

// 修改购物车（数量等，需带 id）
export function modify(data) {
  return request({
    url: '/h5/cart/modify',
    method: 'post',
    data
  })
}

// H5MemberCartService.deleteByIds 按逗号分隔解析 ID。
export function remove(ids) {
  return request({
    url: '/h5/cart/remove',
    method: 'delete',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    data: ids.join(',')
  })
}
