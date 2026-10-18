// Minimal hash router: #/athlete/abc → ['athlete', 'abc']. Hash routes work
// offline and on static hosting without any server rewrites.

import { useSyncExternalStore } from 'react'

const subscribe = (l: () => void) => {
  window.addEventListener('hashchange', l)
  return () => window.removeEventListener('hashchange', l)
}

export function useRoute(): string[] {
  const hash = useSyncExternalStore(subscribe, () => location.hash)
  return hash.replace(/^#\/?/, '').split('/').filter(Boolean)
}

export function navigate(path: string, replace = false) {
  const url = '#' + (path.startsWith('/') ? path : '/' + path)
  if (replace) {
    history.replaceState(null, '', url)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else location.hash = url
  window.scrollTo(0, 0)
}
