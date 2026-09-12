import request from '@/utils/request'
export const levelCenter = () => request.get('/h5/member/level')
export const upgradeLevel = expectedLevel => request.post('/h5/member/level/upgrade', { expectedLevel })
export const saveAppearance = data => request.post('/h5/member/level/appearance', data)
export const comments = (productId, after = 0) => request.get('/h5/member/level/comments', { params: { productId, after } })
export const postComment = (productId, content, emote) => request.post('/h5/member/level/comments', { productId, content, emote })
