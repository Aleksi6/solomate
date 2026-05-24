import budgetPlannerAvatar from '../assets/personas/ghosts/budget_planner.png.png'
import customCompanionAvatar from '../assets/personas/ghosts/custom_companion.png.png'
import gameSpriteAvatar from '../assets/personas/ghosts/game_sprite.png.png'
import gentleFriendAvatar from '../assets/personas/ghosts/gentle_friend.png.png'
import localGuideAvatar from '../assets/personas/ghosts/local_guide.png.png'
import photoBuddyAvatar from '../assets/personas/ghosts/photo_buddy.png.png'

export const personaAvatarMap = {
  gentle_friend: gentleFriendAvatar,
  local_guide: localGuideAvatar,
  photo_buddy: photoBuddyAvatar,
  budget_planner: budgetPlannerAvatar,
  easy_planner: budgetPlannerAvatar,
  planner: budgetPlannerAvatar,
  game_sprite: gameSpriteAvatar,
  task_sprite: gameSpriteAvatar,
  game_companion: gameSpriteAvatar,
  custom_companion: customCompanionAvatar,
  custom: customCompanionAvatar,
  personalized: customCompanionAvatar,
  personalized_companion: customCompanionAvatar,
  private_companion: customCompanionAvatar,
  custom_friend: customCompanionAvatar,
  user_custom: customCompanionAvatar,
  user_companion: customCompanionAvatar,
  personal_companion: customCompanionAvatar,
}

const normalizePersonaId = (personaId = '') => String(personaId || '').trim().toLowerCase()

const looksLikeAssetPath = (value = '') =>
  /^data:image\//.test(value) || /^blob:/.test(value) || /^\//.test(value) || /^https?:\/\//.test(value)

export const getPersonaAvatar = (personaId = 'gentle_friend') => {
  const normalizedId = normalizePersonaId(personaId)
  return personaAvatarMap[normalizedId] || gentleFriendAvatar
}

export const getCompanionAvatar = (persona) => {
  if (typeof persona === 'string') {
    return getPersonaAvatar(persona)
  }

  const avatarUrl = persona?.avatarUrl || persona?.avatar_url || persona?.image
  if (avatarUrl && looksLikeAssetPath(avatarUrl)) {
    return avatarUrl
  }

  const avatarCandidate = persona?.avatar
  if (avatarCandidate && typeof avatarCandidate === 'string' && looksLikeAssetPath(avatarCandidate)) {
    return avatarCandidate
  }

  return getPersonaAvatar(persona?.id || persona?.persona_id || persona?.base_persona_id || persona?.type || 'gentle_friend')
}
