const TOKEN_KEY = 'ry_mall_token'
const USER_KEY = 'ry_mall_user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
  removeUser()
  sessionStorage.removeItem('checkout_items')
}

export function getUser() {
  const str = localStorage.getItem(USER_KEY)
  try { return str ? JSON.parse(str) : null } catch { removeUser(); return null }
}

export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function removeUser() {
  localStorage.removeItem(USER_KEY)
}
