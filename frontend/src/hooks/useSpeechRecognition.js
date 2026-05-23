import { useCallback, useEffect, useRef, useState } from 'react'

const getRecognitionConstructor = () => {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

function useSpeechRecognition({ onFinalTranscript } = {}) {
  const recognitionRef = useRef(null)
  const onFinalTranscriptRef = useRef(onFinalTranscript)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript
  }, [onFinalTranscript])

  useEffect(() => {
    const Recognition = getRecognitionConstructor()
    setIsSupported(Boolean(Recognition))
    if (!Recognition) return undefined

    const recognition = new Recognition()
    recognition.lang = 'zh-CN'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onstart = () => {
      setError('')
      setIsListening(true)
    }

    recognition.onresult = (event) => {
      let finalText = ''
      let interimText = ''

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        const text = result[0]?.transcript || ''
        if (result.isFinal) {
          finalText += text
        } else {
          interimText += text
        }
      }

      const visibleText = `${finalText}${interimText}`.trim()
      if (visibleText) setTranscript(visibleText)

      const cleanFinalText = finalText.trim()
      if (cleanFinalText) {
        onFinalTranscriptRef.current?.(cleanFinalText)
      }
    }

    recognition.onerror = (event) => {
      setError(event.error || 'speech-recognition-error')
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.onstart = null
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      recognition.stop()
      recognitionRef.current = null
    }
  }, [])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('unsupported')
      return
    }

    setTranscript('')
    setError('')

    try {
      recognitionRef.current.start()
    } catch {
      setError('already-started')
    }
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setError('')
  }, [])

  return {
    error,
    isListening,
    isSupported,
    resetTranscript,
    startListening,
    stopListening,
    transcript,
  }
}

export default useSpeechRecognition
