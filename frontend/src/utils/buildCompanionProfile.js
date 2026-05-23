const mapSafetyLevel = {
  gentle: 'soft',
  balanced: 'balanced',
  strong: 'strong',
}

const defaultAvatarMap = {
  gentle_friend: '🧡',
  local_guide: '🧭',
  photo_buddy: '📷',
  budget_planner: '☘️',
  game_sprite: '✨',
}

const buildSummaryLine = (answers) =>
  [answers.personality, answers.speakingStyle, answers.decisionStyle].filter(Boolean).join(' / ')

const slugify = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-\u4e00-\u9fa5]/g, '')

export const buildCompanionProfile = (answers, fixedPersona) => {
  const displayName = String(answers.customName || '').trim() || `${fixedPersona.name} 旅伴`
  const personaId = fixedPersona.id
  const id = `custom-${personaId}-${slugify(displayName)}-${Date.now()}`

  return {
    id,
    persona_id: personaId,
    name: displayName,
    avatar: defaultAvatarMap[personaId] || fixedPersona.avatar || '✨',
    typeLabel: answers.personality || '旅行搭子',
    tags: [answers.speakingStyle, answers.decisionStyle, answers.taskPreference].filter(Boolean),
    latestSummary: buildSummaryLine(answers),
    speaking_style: answers.speakingStyle || '',
    decision_style: answers.decisionStyle || '',
    safety_reminder_level: mapSafetyLevel[answers.safetyLevel] || 'balanced',
    travel_task_preference: answers.taskPreference || '',
    photo_memory_preference: answers.photoPreference || '',
    voice_style: answers.voiceStyle || '',
    custom_name: displayName,
    created_at: new Date().toISOString(),
  }
}
