const STORAGE_KEYS = {
  memoryTimeline: 'memoryTimeline',
  memoryFragments: 'memoryFragments',
  badges: 'badges',
}

const GENERIC_TITLES = new Set(['记录此刻心情', '此刻心情', '今天的一个瞬间', '今天的小停靠', '旅行碎片', '心情记录'])
const NOISE_TEXTS = new Set(['', '.', '。', '°°', '...', '…', '-', '--'])
const DEFAULT_FALLBACK_TEXTS = new Set(['把这一刻轻轻放进今天。', '把这一刻轻轻收进今天。'])

const readArray = (key) => {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeArray = (key, value) => {
  if (typeof window === 'undefined') return value
  const nextValue = Array.isArray(value) ? value : []
  window.localStorage.setItem(key, JSON.stringify(nextValue))
  return nextValue
}

const normalizeTime = (value) => {
  if (!value) return new Date().toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

const formatMemoryTime = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const sameDay = now.toDateString() === date.toDateString()
  const timeText = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  if (sameDay) return `今天 ${timeText}`
  return date.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const inferType = (item) => {
  if (item.type) return item.type
  if (item.dropKind === 'achievement') return 'achievement'
  if (item.dropKind === 'badge' || item.source === 'badge_drop') return 'badge'
  if (item.source === 'souvenir_card' || item.photo_mode === 'souvenir') return 'souvenir_card'
  if (item.source === 'moment') return 'mood_note'
  return 'text_note'
}

export const isMeaningfulText = (text) => {
  if (typeof text !== 'string') return false
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return false
  if (NOISE_TEXTS.has(normalized)) return false
  return /[\p{L}\p{N}\u4e00-\u9fff]/u.test(normalized)
}

export const isFileNameText = (text) => {
  if (typeof text !== 'string') return false
  const normalized = text.trim().toLowerCase()
  return /\.(png|jpg|jpeg|webp|gif|bmp|svg)$/i.test(normalized)
}

const cleanText = (text) => {
  if (!isMeaningfulText(text)) return ''
  if (isFileNameText(text)) return ''
  return String(text).replace(/\s+/g, ' ').trim()
}

const areEquivalentTexts = (left, right) => {
  const normalizedLeft = cleanText(left)
  const normalizedRight = cleanText(right)
  return normalizedLeft && normalizedRight && normalizedLeft === normalizedRight
}

export const getMemoryMainText = (item) => {
  const candidates = [item.content, item.description, item.text, item.note, item.title]
  for (const candidate of candidates) {
    const normalized = cleanText(candidate)
    if (!normalized) continue
    if (GENERIC_TITLES.has(normalized)) continue
     if (DEFAULT_FALLBACK_TEXTS.has(normalized) && (item.hasImage || item.image || item.imageUrl || item.photoUrl)) continue
    return normalized
  }
  return ''
}

export const getMemoryDisplayTitle = (item, mainText, type) => {
  const normalizedTitle = cleanText(item.title)
  if (!normalizedTitle) return ''
  if (GENERIC_TITLES.has(normalizedTitle) && ['mood_note', 'text_note', 'moment'].includes(type)) return ''
  if (isFileNameText(normalizedTitle)) return ''
  if (mainText && areEquivalentTexts(normalizedTitle, mainText)) return ''
  return normalizedTitle
}

export const getMemoryDisplayContent = (item, mainText, displayTitle) => {
  const candidates = [item.description, item.content, item.text, item.note]
  for (const candidate of candidates) {
    const normalized = cleanText(candidate)
    if (!normalized) continue
    if (DEFAULT_FALLBACK_TEXTS.has(normalized) && (item.hasImage || item.image || item.imageUrl || item.photoUrl)) continue
    if (mainText && areEquivalentTexts(normalized, mainText)) continue
    if (displayTitle && areEquivalentTexts(normalized, displayTitle)) continue
    return normalized
  }
  return ''
}

export const normalizeMemoryItem = (item) => {
  const image = item.image || item.imageUrl || item.photoUrl || ''
  const time = normalizeTime(item.time || item.collectedAt)
  const type = inferType(item)
  const mainText = getMemoryMainText(item)
  const hasImage = Boolean(image)
  const isCompactType = ['badge', 'achievement', 'task_complete'].includes(type)
  const cardVariant = hasImage ? 'large' : isCompactType ? 'compact' : 'medium'
  const displayTitle = getMemoryDisplayTitle(item, mainText, type)
  const displayDescription = getMemoryDisplayContent(item, mainText, displayTitle)

  return {
    ...item,
    id: item.id || `memory-${Date.now()}`,
    type,
    title: displayTitle || item.title || '今天的一个瞬间',
    content: mainText,
    description: displayDescription,
    mainText,
    image,
    tags: Array.isArray(item.tags) ? item.tags.filter(Boolean) : [],
    time,
    timeLabel: formatMemoryTime(time),
    hasImage,
    cardVariant,
    location: item.location || '',
    rarity: item.rarity || 'common',
    dropKind: item.dropKind || '',
    source: item.source || '',
  }
}

const createTimelineItem = (item) => normalizeMemoryItem(item)

const normalizeLegacyFragment = (fragment) =>
  normalizeMemoryItem({
    id: `legacy-${fragment.id || Date.now()}`,
    type:
      fragment.dropKind === 'achievement'
        ? 'achievement'
        : fragment.dropKind === 'badge' || fragment.type === 'task_badge'
          ? 'badge'
          : fragment.source === 'souvenir_card' || fragment.type === 'souvenir'
            ? 'souvenir_card'
            : 'photo_fragment',
    title: fragment.title || '旅行碎片',
    content: fragment.description || fragment.content || '',
    image: fragment.image || fragment.imageUrl || fragment.photoUrl || '',
    tags: fragment.tags || [],
    time: fragment.time || fragment.collectedAt,
    source: fragment.source || 'memory_fragment',
    location: fragment.location || '',
    rarity: fragment.rarity || 'common',
    dropKind: fragment.dropKind || '',
  })

const normalizeLegacyBadge = (badgeId) =>
  normalizeMemoryItem({
    id: `badge-${badgeId}`,
    type: 'badge',
    title: String(badgeId),
    content: '从旧徽章记录里保留下来的一个旅行成就。',
    tags: ['徽章'],
    time: new Date().toISOString(),
    source: 'legacy_badge',
  })

const buildTimeBucket = (value) => {
  const date = new Date(value || 0)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`
}

const dedupeMemoryItems = (items) => {
  const seenIds = new Set()
  const seenFingerprints = new Set()

  return items.filter((item) => {
    if (!item) return false

    if (item.id && seenIds.has(item.id)) return false
    if (item.id) seenIds.add(item.id)

    const fingerprint = `${item.type}|${cleanText(item.mainText || item.content || '')}|${buildTimeBucket(item.time)}`
    if (cleanText(item.mainText || item.content || '') && seenFingerprints.has(fingerprint)) {
      return false
    }
    if (cleanText(item.mainText || item.content || '')) {
      seenFingerprints.add(fingerprint)
    }

    return true
  })
}

export const readMemoryTimeline = () => dedupeMemoryItems(readArray(STORAGE_KEYS.memoryTimeline).map(normalizeMemoryItem))

export const writeMemoryTimeline = (items) => writeArray(STORAGE_KEYS.memoryTimeline, items)

export const addMemoryTimelineItem = (item) => {
  const normalized = createTimelineItem(item)
  const current = readMemoryTimeline()
  const next = dedupeMemoryItems([normalized, ...current.filter((entry) => entry.id !== normalized.id)])
  writeMemoryTimeline(next)
  return normalized
}

export const saveMoodMoment = ({ content, tags = [], image = '', title = '' }) =>
  addMemoryTimelineItem({
    type: 'mood_note',
    title: title || '记录此刻心情',
    content: content || '把这一刻轻轻收进今天。',
    image,
    tags,
    source: 'moment',
  })

export const saveFragmentToTimeline = (fragment) => addMemoryTimelineItem(normalizeLegacyFragment(fragment))

export const saveBadgeToTimeline = ({ title, content = '', image = '', source = 'badge_drop', rarity = 'common' }) =>
  addMemoryTimelineItem({
    type: source === 'achievement' ? 'achievement' : 'badge',
    title,
    content,
    image,
    tags: rarity === 'rare' ? ['稀有'] : ['徽章'],
    source,
  })

export const readStoredMemoryFragments = () => readArray(STORAGE_KEYS.memoryFragments)

export const writeStoredMemoryFragments = (fragments) => writeArray(STORAGE_KEYS.memoryFragments, fragments)

export const saveMemoryFragmentRecord = (fragment) => {
  const normalized = {
    ...fragment,
    id: fragment.id || `fragment-${Date.now()}`,
    collectedAt: fragment.collectedAt || new Date().toISOString(),
  }

  const current = readStoredMemoryFragments()
  writeStoredMemoryFragments([normalized, ...current.filter((entry) => entry.id !== normalized.id)])
  saveFragmentToTimeline(normalized)
  return normalized
}

export const saveAnalyzePhotoFragment = (fragment, fallbackFragment) => {
  const normalized = {
    ...fallbackFragment,
    ...(fragment || {}),
    id: fragment?.id || fallbackFragment.id || `fragment-${Date.now()}`,
    title: fragment?.title || fallbackFragment.title,
    description: fragment?.description || fragment?.content || fallbackFragment.description || '',
    tags:
      Array.isArray(fragment?.tags) && fragment.tags.length > 0
        ? fragment.tags
        : Array.isArray(fallbackFragment.tags)
          ? fallbackFragment.tags
          : [],
    rarity: fragment?.rarity || fallbackFragment.rarity || 'common',
    collectedAt: fragment?.collectedAt || fallbackFragment.collectedAt || new Date().toISOString(),
    image: fragment?.image || fallbackFragment.image || '',
    location: fragment?.location || fallbackFragment.location || '',
    type: fragment?.type || fallbackFragment.type || 'souvenir',
    source: fragment?.source || fallbackFragment.source || 'memory_fragment',
  }

  return saveMemoryFragmentRecord(normalized)
}

export const sortTimelineByTime = (items) => [...items].sort((left, right) => new Date(right.time || 0) - new Date(left.time || 0))

export const getMergedMemoryTimeline = () => {
  const timeline = readMemoryTimeline()
  const timelineIds = new Set(timeline.map((item) => item.id))
  const legacyFragments = readStoredMemoryFragments()
    .map(normalizeLegacyFragment)
    .filter((item) => !timelineIds.has(item.id))
  const legacyBadges = readArray(STORAGE_KEYS.badges)
    .map(normalizeLegacyBadge)
    .filter((item) => !timelineIds.has(item.id))

  return sortTimelineByTime(dedupeMemoryItems([...timeline, ...legacyFragments, ...legacyBadges]))
}

export const getTimelineTags = () =>
  Array.from(
    new Set(
      getMergedMemoryTimeline()
        .flatMap((item) => item.tags || [])
        .filter(Boolean),
    ),
  )
