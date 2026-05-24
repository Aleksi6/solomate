const readJson = (key, fallback) => {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const getChatCompleted = () => {
  const histories = readJson('chatHistories', {})
  return Object.values(histories).some((entry) => {
    const messages = Array.isArray(entry) ? entry : entry?.messages
    return Array.isArray(messages) && messages.length > 0
  })
}

const getMoodCompleted = () => {
  const timeline = readJson('memoryTimeline', [])
  return timeline.some((item) => ['mood_note', 'text_note', 'moment'].includes(item?.type))
}

const getPhotoCompleted = () => {
  const fragments = readJson('memoryFragments', [])
  const timeline = readJson('memoryTimeline', [])
  return (
    fragments.some((item) => ['photo_fragment', 'souvenir_card', 'souvenir'].includes(item?.type)) ||
    timeline.some((item) => ['photo_fragment', 'souvenir_card', 'image_note'].includes(item?.type))
  )
}

export const getHomeTaskProgress = () => [
  {
    id: 'task-chat',
    title: '今天第一次和搭子聊天',
    description: '跟搭子说一句现在的心情或想去的地方。',
    reward: '不孤单徽章',
    to: '/companion-select',
    status: getChatCompleted(),
    icon: 'chat',
  },
  {
    id: 'task-photo',
    title: '今天第一次拍照分享',
    description: '把眼前的风景寄给搭子，收下一枚城市观察记忆。',
    reward: '城市观察徽章 / 纪念物碎片',
    to: '/photo',
    status: getPhotoCompleted(),
    icon: 'photo',
  },
  {
    id: 'task-mood',
    title: '今天第一次记录心情',
    description: '写下一句此刻的想法，把今天轻轻收进时间线。',
    reward: '此刻心情徽章',
    to: '/moment',
    status: getMoodCompleted(),
    icon: 'mood',
  },
]
