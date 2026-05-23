import { useCallback, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'solomate_voice_settings'
const DEFAULT_SETTINGS = {
  pitch: 1,
  rate: 1,
  voiceURI: '',
}

const readStoredSettings = () => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS

  try {
    return {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}'),
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function useSpeechSynthesis() {
  const [voices, setVoices] = useState([])
  const [settings, setSettings] = useState(readStoredSettings)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  useEffect(() => {
    if (!isSupported) return undefined

    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices())
    }

    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
    }
  }, [isSupported])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const selectedVoice = useMemo(
    () => voices.find((voice) => voice.voiceURI === settings.voiceURI) || null,
    [settings.voiceURI, voices],
  )

  const updateSettings = useCallback((nextSettings) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      ...nextSettings,
    }))
  }, [])

  const cancel = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [isSupported])

  const speak = useCallback(
    (text) => {
      const clean = text?.trim()
      if (!isSupported || !clean) return

      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(clean)
      utterance.lang = selectedVoice?.lang || 'zh-CN'
      utterance.pitch = Number(settings.pitch)
      utterance.rate = Number(settings.rate)
      if (selectedVoice) utterance.voice = selectedVoice

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      window.speechSynthesis.speak(utterance)
    },
    [isSupported, selectedVoice, settings.pitch, settings.rate],
  )

  return {
    cancel,
    isSpeaking,
    isSupported,
    settings,
    speak,
    updateSettings,
    voices,
  }
}

export default useSpeechSynthesis
