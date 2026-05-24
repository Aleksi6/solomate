const STORAGE_KEYS = {
  unlockedAchievements: 'unlockedAchievements',
  shownAchievementToasts: 'shownAchievementToasts',
  pendingAchievementToasts: 'pendingAchievementToasts',
  todayTravelStats: 'todayTravelStats',
}

const readJson = (key, fallback) => {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const writeJson = (key, value) => {
  if (typeof window === 'undefined') return value
  window.localStorage.setItem(key, JSON.stringify(value))
  return value
}

export const getUnlockedAchievements = () => {
  const value = readJson(STORAGE_KEYS.unlockedAchievements, [])
  return Array.isArray(value) ? value : []
}

export const saveUnlockedAchievement = (achievement) => {
  const current = getUnlockedAchievements()
  if (current.some((item) => item.id === achievement.id)) return achievement
  writeJson(STORAGE_KEYS.unlockedAchievements, [achievement, ...current])
  return achievement
}

export const hasUnlockedAchievement = (achievementId) => getUnlockedAchievements().some((item) => item.id === achievementId)

export const getShownAchievementToasts = () => {
  const value = readJson(STORAGE_KEYS.shownAchievementToasts, [])
  return Array.isArray(value) ? value : []
}

export const markAchievementToastShown = (achievementId) => {
  const current = getShownAchievementToasts()
  if (current.includes(achievementId)) return current
  return writeJson(STORAGE_KEYS.shownAchievementToasts, [...current, achievementId])
}

export const getPendingAchievementToasts = () => {
  const value = readJson(STORAGE_KEYS.pendingAchievementToasts, [])
  return Array.isArray(value) ? value : []
}

export const enqueueAchievementToast = (achievement) => {
  const current = getPendingAchievementToasts()
  if (current.some((item) => item.id === achievement.id)) return current
  return writeJson(STORAGE_KEYS.pendingAchievementToasts, [...current, achievement])
}

export const dequeueAchievementToast = () => {
  const current = getPendingAchievementToasts()
  const [first, ...rest] = current
  writeJson(STORAGE_KEYS.pendingAchievementToasts, rest)
  return first || null
}

export const getTodayTravelStats = () => {
  const stats = readJson(STORAGE_KEYS.todayTravelStats, {})
  return stats && typeof stats === 'object' ? stats : {}
}

export const setTodayTravelStats = (stats) => writeJson(STORAGE_KEYS.todayTravelStats, stats && typeof stats === 'object' ? stats : {})
