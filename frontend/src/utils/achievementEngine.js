import achievements from '../config/achievements'
import { getDemoState } from '../store/demoState'
import { addMemoryTimelineItem, getMergedMemoryTimeline } from './memoryStorage'
import {
  enqueueAchievementToast,
  getTodayTravelStats,
  hasUnlockedAchievement,
  markAchievementToastShown,
  saveUnlockedAchievement,
  getShownAchievementToasts,
} from './achievementStorage'

const includesAny = (text = '', words = []) => words.some((word) => String(text).toLowerCase().includes(word))
const todayKey = new Date().toISOString().slice(0, 10)

const readJson = (key, fallback) => {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const isToday = (value) => {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  return date.toISOString().slice(0, 10) === todayKey
}

const getChatHistories = () => {
  const histories = readJson('chatHistories', {})
  return histories && typeof histories === 'object' ? histories : {}
}

const getCustomCompanions = () => {
  const companions = readJson('customCompanions', [])
  return Array.isArray(companions) ? companions : []
}

const getTodayDiary = () => {
  const diary = readJson('todayDiary', null)
  return diary?.date === todayKey ? diary.data : null
}

const buildAchievementContext = () => {
  const state = getDemoState()
  const memoryTimeline = getMergedMemoryTimeline()
  const chatHistories = getChatHistories()
  const customCompanions = getCustomCompanions()
  const todayTravelStats = getTodayTravelStats()
  const chatEntries = Object.values(chatHistories)
  const chatMessages = chatEntries.flatMap((entry) => (Array.isArray(entry) ? entry : entry?.messages || []))
  const badges = state.badges || []
  const visitedPlaces = state.visitedPlaces || []
  const memoryFragments = memoryTimeline.filter((item) => ['photo_fragment', 'souvenir_card', 'achievement', 'badge'].includes(item.type))
  const moodNotes = memoryTimeline.filter((item) => ['mood_note', 'text_note', 'moment'].includes(item.type))

  return {
    state,
    badges,
    visitedPlaces,
    memoryTimeline,
    chatHistories,
    chatMessages,
    customCompanions,
    todayTravelStats,
    memoryFragments,
    moodNotes,
    todayDiary: getTodayDiary(),
  }
}

const evaluators = {
  first_chat_today: (ctx) =>
    Object.values(ctx.chatHistories).some((entry) => {
      if (Array.isArray(entry)) return entry.length > 0
      return isToday(entry?.updatedAt) || (Array.isArray(entry?.messages) && entry.messages.length > 0)
    }),
  custom_companion_created: (ctx) => ctx.customCompanions.some((companion) => isToday(companion?.created_at) || companion?.source === 'quiz'),
  saw_the_sea: (ctx) =>
    ctx.memoryTimeline.some((item) =>
      includesAny(`${item.title} ${item.mainText} ${(item.tags || []).join(' ')}`, ['海', '海边', '沙滩', '浪', 'ocean', 'sea', 'beach']),
    ),
  walked_2km_today: (ctx) => Number(ctx.todayTravelStats.distanceKm || 0) >= 2 || ctx.visitedPlaces.length >= 3,
  first_photo_today: (ctx) => ctx.memoryTimeline.some((item) => ['photo_fragment', 'souvenir_card'].includes(item.type)),
  first_mood_note_today: (ctx) => ctx.moodNotes.length > 0,
  three_memory_fragments_today: (ctx) => ctx.memoryTimeline.filter((item) => ['photo_fragment', 'souvenir_card', 'badge', 'achievement'].includes(item.type)).length >= 3,
  night_safety_guard: (ctx) =>
    ctx.badges.some((badge) => String(badge).includes('安心')) || ctx.chatMessages.some((message) => includesAny(message?.text || '', ['安全', '安心', '夜间'])),
  little_luck_catcher: (ctx) =>
    ctx.moodNotes.some((item) => includesAny(`${item.mainText} ${(item.tags || []).join(' ')}`, ['小确幸', '轻松', '开心'])),
  local_taste_radar: (ctx) =>
    ctx.memoryTimeline.some((item) =>
      includesAny(`${item.title} ${item.mainText} ${(item.tags || []).join(' ')}`, ['食物', '菜单', '小吃', '餐厅', '咖啡', '夜市']),
    ),
  first_badge: (ctx) => ctx.badges.length > 0,
  diary_generated_today: (ctx) => Boolean(ctx.todayDiary),
}

export const evaluateAchievements = () => {
  const context = buildAchievementContext()
  const shownToasts = getShownAchievementToasts()
  const unlocked = []

  achievements.forEach((achievement) => {
    if (hasUnlockedAchievement(achievement.id)) return
    const matched = evaluators[achievement.id]?.(context)
    if (!matched) return

    const record = {
      ...achievement,
      unlockedAt: new Date().toISOString(),
    }

    saveUnlockedAchievement(record)
    addMemoryTimelineItem({
      id: `achievement-${achievement.id}`,
      type: 'achievement',
      title: achievement.title,
      content: achievement.description,
      source: 'achievement_engine',
      tags: ['成就'],
      time: record.unlockedAt,
    })

    if (!shownToasts.includes(achievement.id)) {
      enqueueAchievementToast(record)
    }

    unlocked.push(record)
  })

  return unlocked
}

export const dismissAchievementToast = (achievementId) => {
  if (!achievementId) return
  markAchievementToastShown(achievementId)
}
