import { personas } from '../services/api'

const STORAGE_KEY = 'solomate_demo_state'

const initialState = {
  selectedPersona: personas[0],
  messages: [
    {
      id: 'm1',
      role: 'buddy',
      text: '今天我陪你走。先不用赶路，我们选一条舒服、安全、能留下小记忆的路线。',
      time: '刚刚',
    },
  ],
  badges: ['first_step'],
  completedTasks: [],
  visitedPlaces: ['night_market'],
  moodHistory: [
    { label: '出发前', mood: '有点紧张' },
    { label: '路上', mood: '慢慢放松' },
    { label: '现在', mood: '被陪伴着' },
  ],
}

const normalizeState = (state) => {
  const persona =
    state.selectedPersona ||
    personas.find((item) => item.id === state.personaId || item.id === localStorage.getItem('persona_id')) ||
    personas[0]

  return {
    ...initialState,
    ...state,
    selectedPersona: persona,
    badges: Array.isArray(state.badges) ? state.badges : [],
    completedTasks: Array.isArray(state.completedTasks) ? state.completedTasks : [],
    visitedPlaces: Array.isArray(state.visitedPlaces) ? state.visitedPlaces : [],
    moodHistory: Array.isArray(state.moodHistory) ? state.moodHistory : [],
  }
}

const readState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? normalizeState(JSON.parse(raw)) : initialState
  } catch {
    return initialState
  }
}

const writeState = (state) => {
  const next = normalizeState(state)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  localStorage.setItem('selectedPersona', JSON.stringify(next.selectedPersona))
  localStorage.setItem('completedTasks', JSON.stringify(next.completedTasks))
  localStorage.setItem('badges', JSON.stringify(next.badges))
  localStorage.setItem('visitedPlaces', JSON.stringify(next.visitedPlaces))
  localStorage.setItem('moodHistory', JSON.stringify(next.moodHistory))
  return next
}

export const getDemoState = () => readState()

export const setSelectedPersona = (persona) => {
  const selectedPersona =
    typeof persona === 'string' ? personas.find((item) => item.id === persona) || personas[0] : persona || personas[0]
  const next = { ...readState(), selectedPersona }
  localStorage.setItem('persona_id', selectedPersona.id)
  return writeState(next)
}

export const setPersonaId = (personaId) => {
  const selectedPersona = personas.find((item) => item.id === personaId) || personas[0]
  const next = { ...readState(), selectedPersona }
  localStorage.setItem('persona_id', personaId)
  return writeState(next)
}

export const addMessage = (message) => {
  const state = readState()
  return writeState({ ...state, messages: [...state.messages, message] })
}

export const unlockBadge = (badgeId) => {
  const state = readState()
  if (state.badges.includes(badgeId)) return state
  return writeState({ ...state, badges: [...state.badges, badgeId] })
}

export const completeTask = (taskId, badgeId) => {
  const state = readState()
  return writeState({
    ...state,
    completedTasks: [...new Set([...state.completedTasks, taskId])],
    badges: badgeId ? [...new Set([...state.badges, badgeId])] : state.badges,
  })
}

export const addVisitedPlace = (placeId) => {
  const state = readState()
  return writeState({
    ...state,
    visitedPlaces: [...new Set([...state.visitedPlaces, placeId])],
  })
}

export const addMood = (mood) => {
  const state = readState()
  return writeState({
    ...state,
    moodHistory: [...state.moodHistory, { label: '新记录', mood }],
  })
}

export const resetDemoState = () => writeState(initialState)
