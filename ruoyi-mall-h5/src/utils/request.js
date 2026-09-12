import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, removeToken } from './auth'
import { normalizeResponse } from './contract'

const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API || '/dev-api',
  timeout: 15000
})

service.interceptors.request.use(config => {
  const token = getToken()
  if (token && !config.url.startsWith('/no-auth/') && config.url !== '/h5/account/login') {
    config.headers.Authorization = 'Bearer ' + token
  }
  return config
})

service.interceptors.response.use(response => {
  const res = normalizeResponse(response.data)
  if (Number(res.code) === 200) return res
  if (Number(res.code) === 401 && response.config.url !== '/h5/account/login') handleUnauthorized()
  else ElMessage.error(res.msg || '请求失败')
  const error = new Error(res.msg || '请求失败')
  error.code = Number(res.code)
  return Promise.reject(error)
}, error => {
  if (error.response?.status === 401 && error.config?.url !== '/h5/account/login') handleUnauthorized()
  else ElMessage.error(error.response?.data?.msg || error.response?.data?.message || error.message || '网络异常')
  return Promise.reject(error)
})

let redirecting = false
function handleUnauthorized() {
  removeToken()
  if (redirecting) return
  redirecting = true
  ElMessage.warning('登录已过期，请重新登录')
  const base = import.meta.env.BASE_URL
  if (window.location.pathname === base + 'login') { redirecting = false; return }
  const path = '/' + window.location.pathname.slice(base.length) + window.location.search + window.location.hash
  window.location.replace(base + 'login?redirect=' + encodeURIComponent(path))
}

export default service
