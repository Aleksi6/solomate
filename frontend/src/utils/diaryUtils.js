const TODAY_TAGS_FALLBACK = ['旅行碎片', '今日探索', '小确幸', '轻松记录']
const MOOD_CHANGES_FALLBACK = ['有点紧张', '慢慢放松', '被陪伴着']

const MOOD_WORDS = ['紧张', '放松', '陪伴', '开心', '难过', '疲惫', '轻松', '小确幸', '安心', '慌张', '犹豫']

const unique = (items = []) => Array.from(new Set(items.filter(Boolean).map((item) => String(item).trim()).filter(Boolean)))

const looksLikeMood = (text = '') => MOOD_WORDS.some((word) => String(text).includes(word))

export const buildTodayTags = ({ memoryFragments = [], badges = [], visitedPlaces = [], tasks = [], summaryTags = [] }) => {
  const placeTags = visitedPlaces.map((item) => item?.name || item?.title || item).filter(Boolean)
  const badgeTags = badges.map((item) => item?.name || item?.title || item).filter(Boolean)
  const fragmentTags = memoryFragments
    .flatMap((item) => item?.tags || [])
    .filter(Boolean)
    .filter((tag) => !looksLikeMood(tag))

  const contentTags = memoryFragments
    .map((item) => item?.location || item?.title || '')
    .filter(Boolean)
    .filter((tag) => !looksLikeMood(tag))

  const taskTags = tasks.map((item) => item?.title || item?.name || item).filter(Boolean)
  const cleanedSummaryTags = summaryTags.filter((tag) => !looksLikeMood(tag))

  const result = unique([...cleanedSummaryTags, ...fragmentTags, ...contentTags, ...badgeTags, ...placeTags, ...taskTags]).slice(0, 6)
  return result.length ? result : TODAY_TAGS_FALLBACK
}

export const buildMoodChanges = ({ moodHistory = [], moodNotes = [], chatHistory = [], memoryTimeline = [] }) => {
  const historyMoods = moodHistory.map((item) => item?.mood || item?.label || item).filter(Boolean)
  const noteMoods = moodNotes.flatMap((item) => item?.tags || []).filter(Boolean)
  const memoryMoods = memoryTimeline
    .filter((item) => ['mood_note', 'text_note', 'moment'].includes(item?.type))
    .flatMap((item) => item?.tags || [])
    .filter(Boolean)

  const chatMoods = chatHistory
    .map((item) => item?.text || '')
    .filter((text) => looksLikeMood(text))
    .slice(-2)

  const result = unique([...historyMoods, ...noteMoods, ...memoryMoods, ...chatMoods]).slice(0, 6)
  return result.length ? result : MOOD_CHANGES_FALLBACK
}

export const avoidSameTags = (todayTags = [], moodChanges = []) => {
  const uniqueToday = unique(todayTags)
  const uniqueMood = unique(moodChanges)

  if (uniqueToday.length && uniqueMood.length && uniqueToday.join('|') === uniqueMood.join('|')) {
    return {
      todayTags: TODAY_TAGS_FALLBACK,
      moodChanges: uniqueMood.length ? uniqueMood : MOOD_CHANGES_FALLBACK,
    }
  }

  return {
    todayTags: uniqueToday.length ? uniqueToday : TODAY_TAGS_FALLBACK,
    moodChanges: uniqueMood.length ? uniqueMood : MOOD_CHANGES_FALLBACK,
  }
}

export { TODAY_TAGS_FALLBACK, MOOD_CHANGES_FALLBACK }
