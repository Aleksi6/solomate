import {
  getActiveCompanionProfile,
  getMemoryFragments,
  getRecentChatSummary,
  getTravelMemorySummary,
  getUserPreferenceProfile,
} from '../utils/companionStorage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"
const REQUEST_TIMEOUT_MS = 5000

export const personas = [
  {
    id: 'gentle_friend',
    name: '温柔朋友型',
    tagline: '陪你聊天，提醒安全',
    avatar: '🌤️',
    tone: '温柔、自然、像朋友',
    openingLine: '今天我陪你走，不用急，我们慢慢来。',
  },
  {
    id: 'local_guide',
    name: '本地向导型',
    tagline: '讲故事，推荐路线',
    avatar: '🧭',
    tone: '亲切、清楚、懂城市',
    openingLine: '我来当你的本地向导，边走边讲这座城。',
  },
  {
    id: 'photo_buddy',
    name: '摄影搭子型',
    tagline: '找角度，写文案',
    avatar: '📷',
    tone: '审美、鼓励、轻松',
    openingLine: '看到好看的地方就拍给我，我帮你找画面。',
  },
  {
    id: 'budget_planner',
    name: '省钱规划型',
    tagline: '少绕路，控预算',
    avatar: '☕',
    tone: '实用、清楚、低废话',
    openingLine: '我帮你把时间、体力和预算安排得更划算。',
  },
  {
    id: 'game_sprite',
    name: '城市精灵型',
    tagline: '发任务，解锁徽章',
    avatar: '✨',
    tone: '活泼、有任务感',
    openingLine: '城市探索任务开启，今天先解锁第一枚徽章。',
  },
]

export const tasks = [
  {
    id: 'first_voice_task',
    title: '旅行第一步',
    description: '和你的旅行搭子完成第一次对话。',
    rewardBadge: '不孤单徽章',
    rewardName: '不孤单徽章',
  },
  {
    id: 'firework_photo_task',
    title: '烟火气打卡',
    description: '拍一张有本地生活气息的照片。',
    rewardBadge: '城市烟火徽章',
    rewardName: '城市烟火徽章',
  },
  {
    id: 'local_food_task',
    title: '本地味道挑战',
    description: '记录一份食物、菜单或餐厅招牌。',
    rewardBadge: '本地味道徽章',
    rewardName: '本地味道徽章',
  },
  {
    id: 'safe_route_task',
    title: '安心路线选择',
    description: '选择一条人多、明亮、适合独行的路线。',
    rewardBadge: '安心探索徽章',
    rewardName: '安心探索徽章',
  },
]

export const badges = [
  { id: '不孤单徽章', name: '不孤单徽章', description: '迈出今天的第一步。' },
  { id: '城市烟火徽章', name: '城市烟火徽章', description: '捕捉到城市温热的一面。' },
  { id: '本地味道徽章', name: '本地味道徽章', description: '发现了一口当地味道。' },
  { id: '安心探索徽章', name: '安心探索徽章', description: '做出了更安心的路线选择。' },
]

const mockPlaces = [
  {
    id: 'night_market',
    name: '夜市街区',
    type: 'food',
    distance: 600,
    safety_level: 'high',
    tags: ['吃饭', '人多', '夜间安全', '烟火气'],
    description: '适合单人旅行者吃饭和短暂停留，人流较多，夜间相对安心。',
    task_id: 'firework_photo_task',
  },
  {
    id: 'old_street',
    name: '老街入口',
    type: 'culture',
    distance: 850,
    safety_level: 'medium',
    tags: ['拍照', '文化', '散步', '街景'],
    description: '适合白天或傍晚慢慢逛，可以拍到有城市记忆感的街景。',
    task_id: 'firework_photo_task',
  },
  {
    id: 'riverside',
    name: '江边步道',
    type: 'view',
    distance: 1200,
    safety_level: 'medium',
    tags: ['风景', '散步', '夜景'],
    description: '风景好，但夜间单人前往需要注意人流和照明情况。',
    task_id: 'safe_route_task',
  },
]

const mockChatResponse = {
  reply_text:
    '没关系，我陪你。你现在一个人出行，可以先去人多、灯光亮的夜市街区，短暂停留一下再决定下一站。',
  reply_type: 'comfort_decision',
  emotion_detected: 'uncertain',
  suggested_action: 'go_to_night_market',
  safety_tip: '夜间单人出行建议优先选择主路和人流较多的区域。',
  next_options: ['去夜市', '找咖啡店休息', '回酒店'],
  task_triggered: 'firework_photo_task',
}

const mockPhotoResponse = {
  scene_summary: '画面中有街道、灯光和生活气息，接近城市夜间街区场景。',
  safety_observation: '从画面看，灯光较明显，适合短暂停留；夜间单人出行仍建议靠近主路和人流较多区域。',
  photo_advice: '可以把灯光、招牌和街道线条放进画面，让城市烟火气更明显。',
  task_result: {
    passed: true,
    reward_badge: '城市烟火徽章',
    reason: '照片包含城市街区和生活氛围，符合烟火气打卡要求。',
  },
  reply_text: '我看到了你眼前的城市烟火气，这张照片可以完成任务，城市烟火徽章已解锁。',
}

const mockDiaryResponse = {
  diary:
    '今天你一个人走过了老街入口和夜市街区。一开始你有点犹豫，但后来你完成了烟火气打卡，也慢慢放松下来。你解锁了城市烟火徽章。这不是一次孤单的旅行，而是一次属于自己的探索。',
  share_caption: '一个人的旅行，也会遇到刚刚好的热闹。',
  route_summary: '今日路线：老街入口 → 夜市街区。完成任务：烟火气打卡。获得徽章：城市烟火徽章。',
  summary_tags: ['单人旅行', '夜市', '烟火气'],
}

const mockCompleteTaskResponse = {
  completed_tasks: ['firework_photo_task'],
  badges: ['城市烟火徽章'],
}

const withJsonHeaders = (options = {}) => ({
  ...options,
  headers: {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  },
})

const omitEmptyFields = (payload) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (value === undefined || value === null || value === '') return false
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'object') return Object.keys(value).length > 0
      return true
    }),
  )

const buildChatPayload = (payload = {}) =>
  omitEmptyFields({
    ...payload,
    companion_profile: getActiveCompanionProfile() || payload.companion_profile,
    user_preference_profile: getUserPreferenceProfile() || payload.user_preference_profile,
    travel_memory_summary: getTravelMemorySummary() || payload.travel_memory_summary,
    recent_chat_summary: getRecentChatSummary() || payload.recent_chat_summary,
  })

const buildDiaryPayload = (payload = {}) =>
  omitEmptyFields({
    ...payload,
    memory_fragments:
      Array.isArray(payload.memory_fragments) && payload.memory_fragments.length > 0
        ? payload.memory_fragments
        : getMemoryFragments().slice(-12),
    mood_notes: Array.isArray(payload.mood_notes) ? payload.mood_notes : [],
    companion_profile: getActiveCompanionProfile() || payload.companion_profile,
    travel_memory_summary: getTravelMemorySummary() || payload.travel_memory_summary,
  })

const buildPhotoPayload = (payload = {}) =>
  omitEmptyFields({
    ...payload,
    photo_mode: payload.photo_mode,
  })

export const safeFetch = async (path, options = {}, mockData) => {
  if (!API_BASE_URL) return mockData

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
    })

    if (!response.ok) return mockData
    return await response.json()
  } catch {
    return mockData
  } finally {
    clearTimeout(timeoutId)
  }
}

export const getMockPlaces = async () => safeFetch('/api/mock-places', { method: 'GET' }, mockPlaces)

export const sendChatMessage = async (payload) =>
  safeFetch(
    '/api/chat',
    withJsonHeaders({
      method: 'POST',
      body: JSON.stringify(buildChatPayload(payload)),
    }),
    mockChatResponse,
  )

export const analyzePhoto = async (payload) =>
  safeFetch(
    '/api/analyze-photo',
    withJsonHeaders({
      method: 'POST',
      body: JSON.stringify(buildPhotoPayload(payload)),
    }),
    mockPhotoResponse,
  )

export const completeTask = async (payload) =>
  safeFetch(
    '/api/complete-task',
    withJsonHeaders({
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    mockCompleteTaskResponse,
  )

export const generateDiary = async (payload) =>
  safeFetch(
    '/api/generate-diary',
    withJsonHeaders({
      method: 'POST',
      body: JSON.stringify(buildDiaryPayload(payload)),
    }),
    mockDiaryResponse,
  )
