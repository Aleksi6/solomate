import memoryFragmentConfig from '../../../config/memory_fragments.json'

const MEMORY_FRAGMENT_KEY = 'memoryFragments'
const MEMORY_DROP_STATE_KEY = 'memoryDropState'

const formatCollectedAt = () =>
  new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date())

export const readMemoryFragments = () => {
  try {
    const raw = localStorage.getItem(MEMORY_FRAGMENT_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const writeMemoryFragments = (fragments) => {
  localStorage.setItem(MEMORY_FRAGMENT_KEY, JSON.stringify(fragments))
  return fragments
}

const readDropState = () => {
  try {
    return JSON.parse(localStorage.getItem(MEMORY_DROP_STATE_KEY) || '{}')
  } catch {
    return {}
  }
}

const writeDropState = (state) => {
  localStorage.setItem(MEMORY_DROP_STATE_KEY, JSON.stringify(state))
}

const createStoredFragment = (fragment, source) => ({
  ...fragment,
  id: `${fragment.id}-${Date.now()}`,
  source,
  collectedAt: fragment.collectedAt || formatCollectedAt(),
})

const saveNewFragments = (newFragments) => {
  if (newFragments.length === 0) return readMemoryFragments()
  const existing = readMemoryFragments()
  return writeMemoryFragments([...newFragments, ...existing])
}

const pickRandomDrop = () => {
  const pool = memoryFragmentConfig.randomDrops || []
  if (pool.length === 0) return null
  return pool[Math.floor(Math.random() * pool.length)]
}

export const saveMemoryFragment = (fragment) => {
  const storedFragment = createStoredFragment(fragment, 'souvenir_card')
  saveNewFragments([storedFragment])
  return storedFragment
}

export const triggerMemoryDrop = (trigger) => {
  const state = readDropState()
  let selectedDrop = null
  const nextState = { ...state }

  if (trigger === 'environment_analysis' && !state.firstEnvironmentDrop) {
    selectedDrop = memoryFragmentConfig.environmentFirstDrop
    nextState.firstEnvironmentDrop = true
  } else if (trigger === 'souvenir_saved' && !state.firstSouvenirDrop) {
    selectedDrop = memoryFragmentConfig.souvenirFirstDrop
    nextState.firstSouvenirDrop = true
  } else if (Math.random() < 0.35) {
    selectedDrop = pickRandomDrop()
  }

  if (!selectedDrop) {
    writeDropState(nextState)
    return null
  }

  const storedDrop = createStoredFragment(selectedDrop, trigger)
  saveNewFragments([storedDrop])
  writeDropState(nextState)
  return storedDrop
}
