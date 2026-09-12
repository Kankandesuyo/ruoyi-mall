// Uploaded images are served by the API, including when the frontend uses a proxy.
export function avatarUrl(value) {
  if (!value) return ''
  if (value.startsWith('/profile/')) {
    return (import.meta.env.VITE_APP_BASE_API || '/dev-api').replace(/\/$/, '') + value
  }
  return /^https?:\/\//i.test(value) ? value : ''
}
