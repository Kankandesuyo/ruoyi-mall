import request from '@/utils/request'

// 商品分页列表（body=ProductQuery，支持 nameLike/categoryId/search/brandNameLike）
export function list(query = {}, page = 0, size = 12) {
  return request({
    url: '/no-auth/product/list',
    method: 'post',
    params: { page, size },
    data: { ...query, publishStatus: 1 }
  })
}

// 商品详情
export function detail(id) {
  return request({
    url: '/no-auth/product/detail/' + id,
    method: 'get'
  })
}
