import { getMemoryFragments, saveMemoryFragment as persistMemoryFragment } from '../store/demoState'
import memoryFragmentsConfig from '../../../config/memory_fragments.json'

const MEMORY_DROP_STATE_KEY = 'memoryDropState'

const readJson = (key, fallbackValue) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallbackValue
  } catch {
    return fallbackValue
  }
}

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
  return value
}

export const readMemoryFragments = () => getMemoryFragments()

export const saveMemoryFragment = (fragment) => persistMemoryFragment(fragment)

export const triggerMemoryDrop = (trigger) => {
  const dropState = readJson(MEMORY_DROP_STATE_KEY, { unlocked: [] })
  const unlockedIds = new Set(Array.isArray(dropState.unlocked) ? dropState.unlocked : [])
  const source = Array.isArray(memoryFragmentsConfig) ? memoryFragmentsConfig : []

  const match = source.find((item) => item.trigger === trigger && !unlockedIds.has(item.id))
  if (!match) return null

  unlockedIds.add(match.id)
  writeJson(MEMORY_DROP_STATE_KEY, { unlocked: Array.from(unlockedIds) })

  return {
    ...match,
    created_at: new Date().toISOString(),
  }
}
