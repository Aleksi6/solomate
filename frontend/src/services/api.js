const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
const REQUEST_TIMEOUT_MS = 5000

export const personas = [
  {
    id: 'gentle_friend',
    name: '温柔朋友型',
    tagline: '陪你聊天，也提醒你照顾自己。',
    avatar: '旅',
    tone: '温柔、自然、像朋友',
    openingLine: '今天我陪你走，不用急，我们慢慢来。',
  },
  {
    id: 'local_guide',
    name: '本地向导型',
    tagline: '讲故事，也帮你选更安心的路线。',
    avatar: '城',
    tone: '亲切、清楚、懂城市',
    openingLine: '我来当你的本地向导，边走边给你讲这座城。',
  },
  {
    id: 'photo_buddy',
    name: '摄影搭子型',
    tagline: '一起找光线、角度和旅行感画面。',
    avatar: '拍',
    tone: '有审美、会鼓励、轻松自然',
    openingLine: '看到好看的地方就拍给我，我帮你找画面。',
  },
  {
    id: 'budget_planner',
    name: '省钱规划型',
    tagline: '少绕路，帮你把预算和体力算清楚。',
    avatar: '省',
    tone: '实用、清楚、低废话',
    openingLine: '我帮你把时间、体力和预算安排得更划算。',
  },
  {
    id: 'game_sprite',
    name: '城市精灵型',
    tagline: '发任务，解锁徽章。',
    avatar: '星',
    tone: '活泼、有任务感，但不过度幼稚',
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
    safety: '高',
    tags: ['吃饭', '人多', '夜间安全', '烟火气'],
    description: '适合一个人慢慢逛、吃点东西、观察城市烟火气。',
    task_id: 'firework_photo_task',
  },
  {
    id: 'old_street',
    name: '老街入口',
    type: 'culture',
    distance: 850,
    safety_level: 'medium',
    safety: '中',
    tags: ['拍照', '文化', '散步', '街景'],
    description: '适合傍晚慢慢逛，可以拍到有城市记忆感的街景。',
    task_id: 'firework_photo_task',
  },
  {
    id: 'coffee_stop',
    name: '街角咖啡店',
    type: 'rest',
    distance: 400,
    safety_level: 'high',
    safety: '高',
    tags: ['休息', '喝咖啡', '短暂停留'],
    description: '适合先坐下来缓一会儿，再决定下一步去哪。',
    task_id: '',
  },
  {
    id: 'riverside',
    name: '江边步道',
    type: 'view',
    distance: 1200,
    safety_level: 'medium',
    safety: '中',
    tags: ['风景', '散步', '夜景'],
    description: '风景不错，但夜间独自前往时还是要留意人流和照明。',
    task_id: 'safe_route_task',
  },
]

const mockPhotoResponse = {
  scene_summary: '画面里有街道、灯光和旅行氛围，适合作为这次行程的照片记录。',
  safety_observation: '单人出行时更适合停留在明亮、开放、容易求助的区域。',
  photo_advice: '可以把灯光、招牌和街道层次放进画面，让旅行感更完整。',
  task_result: {
    passed: true,
    reward_badge: '城市烟火徽章',
    reason: '照片包含城市街区和生活氛围，符合烟火气打卡的要求。',
  },
  reply_text: '我看到你眼前的旅行场景了，这张照片可以作为任务和日记素材。',
}

const buildMockPhotoResponse = (payload = {}) => {
  const taskId = payload.task_id || 'firework_photo_task'
  const rewardMap = {
    firework_photo_task: '城市烟火徽章',
    local_food_task: '本地味道徽章',
    safe_route_task: '安心探索徽章',
  }

  if (taskId === 'local_food_task') {
    return {
      scene_summary: '这张照片更像一份在地味道的记录，适合留作今天吃到什么的小小凭证。',
      safety_observation: '按当前 Demo mock 判断，拍食物时尽量靠近明亮区域，也别把随身物品离手太远。',
      photo_advice: '靠近食物主体一点，再留一点桌面或店招，会更有“我真的在这里吃过”的感觉。',
      task_result: {
        passed: true,
        reward_badge: rewardMap[taskId],
        reason: '当前为 Demo mock 判定，未启用真实视觉模型时会先按任务类型给出保守结果。',
      },
      reply_text: '我先把这张照片当作今天的一枚记忆碎片收下来了。即使现在走的是 Demo mock 识别，这条观察也还能继续留在碎片册里。',
    }
  }

  if (taskId === 'safe_route_task') {
    return {
      scene_summary: '这张照片更像一段路线观察记录，可以拿来判断这条路是不是适合一个人继续往前走。',
      safety_observation: '按当前 Demo mock 判断，亮灯、主路和稳定人流会是更安心的路线线索。',
      photo_advice: '如果想让路线感更清楚，可以把前方道路、路口灯光和周边店面一起拍进来。',
      task_result: {
        passed: true,
        reward_badge: rewardMap[taskId],
        reason: '当前为 Demo mock 判定，未启用真实视觉模型时会先按任务类型给出保守结果。',
      },
      reply_text: '我先把这张照片当作今天的一枚记忆碎片收下来了。即使现在走的是 Demo mock 识别，这条观察也还能继续留在碎片册里。',
    }
  }

  return {
    ...mockPhotoResponse,
    task_result: {
      ...mockPhotoResponse.task_result,
      reward_badge: rewardMap[taskId] || rewardMap.firework_photo_task,
      reason: '当前为 Demo mock 判定，未启用真实视觉模型时会先按任务类型给出保守结果。',
    },
    reply_text: '我先把这张照片当作今天的一枚记忆碎片收下来了。即使现在走的是 Demo mock 识别，这条观察也还能继续留在碎片册里。',
  }
}

const mockDiaryResponse = {
  diary: '今天你一个人走过了老街入口和夜市街区。起初有一点犹豫，但你还是慢慢做出了下一步选择，也把这趟旅程认真记录了下来。',
  share_caption: '一个人的旅行，也会遇到刚刚好的热闹。',
  summary_tags: ['单人旅行', 'AI搭子', '城市探索'],
}

const mockCompleteTaskResponse = {
  completed_tasks: ['firework_photo_task'],
  badges: ['城市烟火徽章'],
}

const mockLlmStatus = {
  llm_enable: false,
  provider: 'openai_compatible',
  has_api_key: false,
  has_base_url: false,
  has_model: false,
  model: '',
  timeout_ms: 8000,
}

const mockVisionStatus = {
  vision_enable: false,
  provider: '',
  has_api_key: false,
  has_base_url: false,
  has_model: false,
  model: '',
  timeout_ms: 10000,
}

const mockVoiceStatus = {
  browser_asr_recommended: true,
  backend_asr_enabled: false,
  tts_recommended: 'browser_speech_synthesis',
}

const mockLiveContextStatus = {
  geolocation_recommended: true,
  weather_enable: false,
  weather_has_api_key: false,
  fallback: 'mock live_context',
}

const withJsonHeaders = (options = {}) => ({
  ...options,
  headers: {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  },
})

const cleanPlaceCandidate = (value = '') => {
  let place = String(value || '').trim()
  if (!place) return ''

  place = place.split(/[\s，。？！!?,、\n]/)[0] || ''
  place = place.replace(/^(那个|这个|这家|这里的|那边的|从这里|从那边)/, '')
  place = place.replace(/(啊|呀|呢|了|吧|嘛|哦|呐)+$/g, '')
  place = place.replace(/(玩|逛|看看|看一看|拍照|打卡|吃饭|喝咖啡|喝点东西)+$/g, '')
  place = place.replace(/(附近|周边)+$/g, '')
  return place.trim()
}

const extractExplicitPlace = (userText = '') => {
  const text = String(userText || '').trim()
  if (!text) return ''

  const patterns = [
    /(?:我又想去|我想去|我要去|准备去|想去)([^，。？！!?,、\s\n]{1,16})/,
    /(?:去)([^，。？！!?,、\s\n]{1,16})(?:玩|逛|看看|打卡)?/,
    /(?:到)([^，。？！!?,、\s\n]{1,16})了/,
    /(?:我在)([^，。？！!?,、\s\n]{1,16})/,
    /(?:想找|想吃|想喝)([^，。？！!?,、\s\n]{1,16})/,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    const place = cleanPlaceCandidate(match?.[1] || '')
    if (place) return place
  }

  return ''
}

const extractRouteIntent = (userText = '', conversationState = {}) => {
  const text = String(userText || '').trim()
  const fallbackTarget = cleanPlaceCandidate(
    conversationState.target_place || conversationState.current_place || conversationState.last_place || '',
  )

  const fullPatterns = [
    /(?:怎么|如何)?从([^，。？！!?,、\s\n]{1,16})去([^，。？！!?,、\s\n]{1,16})/,
    /([^，。？！!?,、\s\n]{1,16})到([^，。？！!?,、\s\n]{1,16})(?:怎么走|怎么去|怎么过去|路线|咋走|咋去)/,
  ]

  for (const pattern of fullPatterns) {
    const match = text.match(pattern)
    const originPlace = cleanPlaceCandidate(match?.[1] || '')
    const targetPlace = cleanPlaceCandidate(match?.[2] || '')
    if (originPlace || targetPlace) {
      return { origin_place: originPlace, target_place: targetPlace, is_route_question: true }
    }
  }

  const originOnlyMatch = text.match(/(?:怎么|如何)?从([^，。？！!?,、\s\n]{1,16})去(?:呢|呀|啊|嘛)?$/)
  if (originOnlyMatch) {
    return {
      origin_place: cleanPlaceCandidate(originOnlyMatch[1] || ''),
      target_place: fallbackTarget,
      is_route_question: true,
    }
  }

  if (/从这里去|怎么从这里去|怎么去那里|怎么过去|怎么去|怎么走|回酒店|回去/.test(text)) {
    return {
      origin_place: cleanPlaceCandidate(
        conversationState.current_place || conversationState.origin_place || conversationState.live_context?.place_name || '',
      ),
      target_place: fallbackTarget,
      is_route_question: true,
    }
  }

  return { origin_place: '', target_place: '', is_route_question: false }
}

const detectIntent = (userText = '', explicitPlace = '', routeInfo = {}) => {
  const text = String(userText || '')
  if (/你怎么知道|定位|位置怎么来的|你有我定位/.test(text)) return 'identity'
  if (/危险|害怕|不安全|有人跟着|迷路|救命/.test(text)) return 'safety'
  if (/我的位置|我在哪|我现在在哪|现在在哪/.test(text)) return 'location_status'
  if (/现在几点|几点了|现在几号|今天几号|几点啦/.test(text)) return 'time'
  if (routeInfo.is_route_question || /怎么去|怎么走|怎么从|从哪里去|从.+到.+|过去|回酒店|回去/.test(text)) return 'route'
  if (/天气|下雨|冷不冷|热不热|带伞|防晒|穿什么|我要出门/.test(text)) return 'weather'
  if (/有什么故事|有什么来历|为什么有名|历史|典故/.test(text)) return 'story'
  if (/有啥好吃的|有什么好吃的|吃什么|想吃|餐厅|小吃|夜宵|火锅|咖啡|喝点什么/.test(text)) return 'food'
  if (/哪里好拍照|哪儿好拍|怎么拍|拍哪里|机位|角度|出片|打卡照|拍照|照片|好拍吗/.test(text)) return 'photo'
  if (/好多人|人好多|太挤|排队|人山人海|热闹/.test(text)) return 'crowd'
  if (explicitPlace) return 'place_specific'
  if (/任务|徽章|打卡|解锁/.test(text)) return 'game'
  if (/不知道去哪|附近有什么|推荐一下|去哪里|想去玩|我要去玩/.test(text)) return 'decision'
  if (/你好|嗨|hello|hi|在吗/.test(text)) return 'greeting'
  return 'chat'
}

const prefersCurrentPlaceForIntent = (intent = '', userText = '') =>
  ['food', 'weather', 'location_status'].includes(intent) || /附近|周边|这边|这里/.test(String(userText || ''))

const buildMockChatResponse = (payload = {}) => {
  const userText = String(payload.user_text || '').trim()
  const conversationState = payload.conversation_state || {}
  const liveContext = conversationState.live_context || payload.live_context || {}
  const routeInfo = extractRouteIntent(userText, conversationState)
  const explicitPlace = extractExplicitPlace(userText)
  const intent = detectIntent(userText, explicitPlace, routeInfo)
  const currentPlace = cleanPlaceCandidate(
    liveContext.place_name ||
      conversationState.current_place ||
      payload.location?.place_name ||
      (liveContext.source === 'browser' && liveContext.latitude != null ? '当前位置' : ''),
  )
  const currentCity = conversationState.current_city || liveContext.city || payload.location?.city || ''
  const targetPlace = cleanPlaceCandidate(conversationState.target_place || conversationState.last_place || '')
  const effectivePlace =
    routeInfo.target_place ||
    explicitPlace ||
    (prefersCurrentPlaceForIntent(intent, userText) ? currentPlace || targetPlace : targetPlace || currentPlace) ||
    ''
  const weather = liveContext.weather || {}
  const timeOfDay = liveContext.time_of_day || ''
  const locationSource = liveContext.source || 'unavailable'

  if (intent === 'identity') {
    return {
      reply_text: '我不会私下获取你的定位，只能看到 App 主动传来的位置字段，或者 Demo 里的模拟位置。',
      reply_type: 'identity_explain',
      emotion_detected: 'uncertain',
      suggested_action: 'clarify_location_source',
      safety_tip: '如果你不想用定位，也可以直接用文字告诉我你大概在哪。',
      next_options: ['继续聊附近建议', '只用文字描述位置', '换个地方问问'],
      task_triggered: '',
    }
  }

  if (intent === 'location_status') {
    const locationLine =
      locationSource === 'browser'
        ? `我当前拿到的实时位置是${currentCity || ''}${currentPlace || ''}。`
        : `我现在没有拿到你设备的实时定位，只能先按${currentCity || ''}${currentPlace || '模拟位置'}来陪你判断。`

    return {
      reply_text: locationLine,
      reply_type: 'location_status',
      emotion_detected: 'uncertain',
      suggested_action: 'clarify_location_source',
      safety_tip: locationSource === 'browser' ? '如果你移动了位置，可以再发一句“说出当前位置”，我会按新的位置继续。' : '如果你愿意开定位或直接用文字告诉我你在哪，我就能接得更准。',
      next_options: ['说出当前位置', '附近有什么', '我想去别的地方'],
      task_triggered: '',
    }
  }

  if (intent === 'time') {
    const localTime = conversationState.live_context?.local_time || payload.live_context?.local_time || ''
    const date = localTime ? new Date(localTime) : new Date()
    const timeText = Number.isNaN(date.getTime())
      ? '我现在拿到的是你这边的本地时间。'
      : `你这边现在大概是${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}。`

    return {
      reply_text: `${timeText}${date.getHours() < 5 ? '已经很晚了，出门的话尽量走主路。' : ''}`,
      reply_type: 'time_status',
      emotion_detected: 'uncertain',
      suggested_action: 'check_time_context',
      safety_tip: date.getHours() < 5 ? '这个时段一个人出门，优先明亮、人流稳定的地方。' : '',
      next_options: ['我要出门', '附近有什么', '有啥好吃的'],
      task_triggered: '',
    }
  }

  if (intent === 'route' && routeInfo.origin_place && effectivePlace) {
    return {
      reply_text: `从${routeInfo.origin_place}去${effectivePlace}的话，我们先按大方向判断：优先看公共交通或打车到核心区域，再步行到目的地。具体路线到现场再用地图确认就好，我先帮你把思路理顺。`,
      reply_type: 'route_advice',
      emotion_detected: 'uncertain',
      suggested_action: 'plan_route',
      safety_tip: '如果已经是晚上，尽量把换乘次数和步行距离都压短一点。',
      next_options: ['先看省力路线', '先看预算路线', '先看到站后怎么走'],
      task_triggered: '',
    }
  }

  if (intent === 'weather') {
    const rainProbability = Number(weather.rain_probability)
    const uvIndex = Number(weather.uv_index)
    const placeLabel = currentPlace ? `${currentPlace}这边` : '你这边'
    const weatherLine =
      rainProbability >= 60
        ? '这会儿雨概率偏高，出门记得带伞。'
        : uvIndex >= 6
          ? '紫外线不低，出门记得防晒和补水。'
          : timeOfDay === 'night'
            ? '如果现在出门，优先走主路，别拐太偏。'
            : '按现在的情况，穿轻便一点、方便随时加减衣服会更舒服。'
    const weatherSourceNote =
      weather.source === 'mock'
        ? `${placeLabel}我先按模拟天气提醒你。`
        : `${placeLabel}我按当前天气信息先提醒你。`

    return {
      reply_text: `${weatherSourceNote}${weatherLine}`,
      reply_type: 'weather_advice',
      emotion_detected: 'uncertain',
      suggested_action: 'check_weather_and_prepare',
      safety_tip: weatherLine,
      next_options: ['我要出门', '附近有什么能躲雨', '现在适合去哪'],
      task_triggered: '',
    }
  }

  if (intent === 'food' && effectivePlace) {
    const placeLabel = currentPlace && prefersCurrentPlaceForIntent(intent, userText) ? currentPlace : effectivePlace

    return {
      reply_text: `${placeLabel}附近可以先找人多、评价稳定、翻台快的小吃或餐馆。要是你刚到这边，优先选街边开阔、进出方便的店，一个人吃也会更放松。你想吃正餐还是小吃？我可以按省力路线帮你挑。`,
      reply_type: 'food_advice',
      emotion_detected: 'uncertain',
      suggested_action: 'find_food_nearby',
      safety_tip: timeOfDay === 'night' ? '夜里找吃的别走太偏，优先亮一点、进出方便的店。' : '一个人找吃的时，优先选明亮、开阔、进出方便的店。',
      next_options: ['想吃正餐', '想吃小吃', '想喝点东西'],
      task_triggered: '',
    }
  }

  if (intent === 'story' && effectivePlace) {
    return {
      reply_text: /[江河湖海滩湾港桥]/.test(effectivePlace)
        ? `${effectivePlace}这种靠水的地方，故事常常和“到达”有关。白天看是城市的边线，到了晚上灯亮起来，它又会变成很多人记忆里最容易停下来的那一段风景。`
        : `像${effectivePlace}这种地方，故事往往不只在资料里，也在它怎么被一代代人反复经过、记住和讲给别人听。你要是愿意，我们可以继续往下聊它为什么会变成城市记忆点。`,
      reply_type: 'story_share',
      emotion_detected: 'relaxed',
      suggested_action: 'share_place_story',
      safety_tip: '',
      next_options: ['讲讲它的来历', '讲讲适合什么时候去', '讲讲附近怎么逛'],
      task_triggered: '',
    }
  }

  if (intent === 'photo' && effectivePlace) {
    return {
      reply_text: `${effectivePlace}如果想拍得更出片，先别急着站最热门的正面机位，找侧一点、层次更开的角度。把灯光、路面引导线或者一点人流带进画面，会更有旅行现场感。`,
      reply_type: 'photo_advice',
      emotion_detected: 'uncertain',
      suggested_action: 'look_for_photo_spot',
      safety_tip: '拍照前先确认脚下和身后，别为了构图退到太边上。',
      next_options: ['换个角度试试', '找侧面灯光', '先避开最挤的位置'],
      task_triggered: 'firework_photo_task',
    }
  }

  if (intent === 'crowd' && effectivePlace) {
    return {
      reply_text: `${effectivePlace}如果人太多，我们先别硬挤最中心。可以先靠边走、找亮一点的位置缓一缓，等一波人流过去再决定继续逛还是换个角度。`,
      reply_type: 'crowd_support',
      emotion_detected: 'uncertain',
      suggested_action: 'avoid_crowded_spot',
      safety_tip: '人挤的时候尽量把手机和包放在身前，也别站在台阶口停太久。',
      next_options: ['先靠边缓一下', '换个方向逛', '找个亮一点的休息点'],
      task_triggered: '',
    }
  }

  if (intent === 'place_specific' && effectivePlace) {
    return {
      reply_text: `好，那我们先把目标切到${effectivePlace}。这轮就围绕${effectivePlace}继续，不用再从头交代。`,
      reply_type: 'place_specific',
      emotion_detected: 'uncertain',
      suggested_action: 'continue_place_plan',
      safety_tip: '边走边看时尽量站在更亮、更开阔的位置停留。',
      next_options: ['问拍照点', '问吃什么', '问怎么去'],
      task_triggered: '',
    }
  }

  return {
    reply_text: effectivePlace
      ? `我知道我们现在聊的是${effectivePlace}。你想先解决路线、吃饭、拍照，还是今晚怎么走得更安心？`
      : '我在。你可以告诉我你现在在哪、想去哪，或者眼下最想解决什么，我陪你把下一步慢慢理清楚。',
    reply_type: 'small_talk',
    emotion_detected: 'neutral',
    suggested_action: '',
    safety_tip: '',
    next_options: ['附近有什么', '有啥好吃的', '哪里好拍照'],
    task_triggered: '',
  }
}

export const safeFetch = async (path, options = {}, mockData) => {
  if (!API_BASE_URL) {
    return typeof mockData === 'function' ? mockData() : mockData
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
    })

    if (!response.ok) {
      return typeof mockData === 'function' ? mockData() : mockData
    }

    return await response.json()
  } catch {
    return typeof mockData === 'function' ? mockData() : mockData
  } finally {
    clearTimeout(timeoutId)
  }
}

export const getMockPlaces = async () => safeFetch('/api/mock-places', { method: 'GET' }, mockPlaces)
export const getLlmStatus = async () => safeFetch('/api/llm-status', { method: 'GET' }, mockLlmStatus)
export const getVisionStatus = async () => safeFetch('/api/vision-status', { method: 'GET' }, mockVisionStatus)
export const getVoiceStatus = async () => safeFetch('/api/voice-status', { method: 'GET' }, mockVoiceStatus)
export const getLiveContextStatus = async () => safeFetch('/api/live-context-status', { method: 'GET' }, mockLiveContextStatus)

export const sendChatMessage = async (payload) =>
  safeFetch(
    '/api/chat',
    withJsonHeaders({
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    () => buildMockChatResponse(payload),
  )

export const analyzePhoto = async (payload = {}) => {
  if (payload.file) {
    const formData = new FormData()
    formData.append('image', payload.file)
    formData.append('task_id', payload.task_id || 'firework_photo_task')
    formData.append('persona_id', payload.persona_id || 'photo_buddy')
    formData.append('user_question', payload.user_question || '')

    return safeFetch(
      '/api/analyze-photo',
      {
        method: 'POST',
        body: formData,
      },
      () => buildMockPhotoResponse(payload),
    )
  }

  return safeFetch(
    '/api/analyze-photo',
    withJsonHeaders({
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    () => buildMockPhotoResponse(payload),
  )
}

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
      body: JSON.stringify(payload),
    }),
    mockDiaryResponse,
  )
