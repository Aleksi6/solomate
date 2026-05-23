import uiCopy from '../../../config/ui_copy.json'

const getGreetingConfig = (personaId) => {
  const greetings = uiCopy.chat?.greetings || {}
  return greetings[personaId] || greetings.default
}

export const getInitialChatGreeting = ({ persona, places = [] }) => {
  const config = getGreetingConfig(persona?.id)
  const hasNearbyPlaces = Array.isArray(places) && places.length > 0

  return {
    weatherHint: hasNearbyPlaces
      ? uiCopy.chat.mock_weather_hint
      : '今天天气晴，适合先选一个轻松、明亮、让人安心的方向。',
    welcome: config.welcome,
    suggestions: config.suggestions.slice(0, 3),
  }
}

export const shouldShowInitialGreeting = (messages = []) =>
  !messages.some((message) => message.role === 'user')
