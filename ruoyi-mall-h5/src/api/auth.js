import request from '@/utils/request'
import { encodeLogin } from '@/utils/contract'

// 后端读取 Base64(UTF-8 JSON)，不是 JSON 对象或带引号的 JSON 字符串。
export function login(data) {
  return request({
    url: '/h5/account/login',
    method: 'post',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    data: encodeLogin(data)
  })
}

// 会员信息
export function getMemberInfo() {
  return request({
    url: '/h5/member/info',
    method: 'get'
  })
}

export function register(data) {
  return request({ url: '/h5/register', method: 'post', data })
}

export function updateProfile(nickname, avatar) {
  const data = new FormData()
  data.append('nickname', nickname)
  if (avatar) data.append('avatar', avatar)
  return request({ url: '/h5/member/profile', method: 'post', data })
}
