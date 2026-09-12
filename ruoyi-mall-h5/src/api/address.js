import request from '@/utils/request'
import { addressPayload } from '@/utils/contract'

// 地址列表
export function list() {
  return request({
    url: '/h5/member/address/list',
    method: 'get'
  })
}

// 默认地址
export function getDefault() {
  return request({
    url: '/h5/member/address/default',
    method: 'get'
  })
}

// 新增
export function create(data) {
  return request({
    url: '/h5/member/address/create',
    method: 'post',
    data: addressPayload(data)
  })
}

// 修改
export function update(data) {
  return request({
    url: '/h5/member/address/update',
    method: 'put',
    data: addressPayload(data)
  })
}

// 删除
export function remove(id) {
  return request({
    url: '/h5/member/address/' + id,
    method: 'delete'
  })
}
