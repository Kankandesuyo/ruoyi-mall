import request from '@/utils/request'
export const activity = () => request({ url: '/h5/act/integral/activity' })
export const signIn = () => request({ url: '/h5/act/integral/add', method: 'post' })
export const history = (page = 0) => request({ url: '/h5/act/integral/history/list', method: 'post', params: { page, size: 20 }, data: {} })
