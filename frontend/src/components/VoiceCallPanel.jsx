import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import useSpeechRecognition from '../hooks/useSpeechRecognition'
import useSpeechSynthesis from '../hooks/useSpeechSynthesis'
import VoiceSettings from './VoiceSettings'

function VoiceCallPanel({ isSending = false, lastReply, onSendMessage, persona }) {
  const spokenReplyIdRef = useRef('')
  const [transientPhase, setTransientPhase] = useState('idle')
  const speechSynthesis = useSpeechSynthesis()
  const speechRecognition = useSpeechRecognition({
    onFinalTranscript: async (text) => {
      setTransientPhase('transcribing')

      try {
        await onSendMessage?.(text)
        speechRecognition.resetTranscript()
      } catch {
        setTransientPhase('error')
        return
      }

      setTransientPhase('idle')
    },
  })

  useEffect(() => {
    if (!lastReply?.id || spokenReplyIdRef.current === lastReply.id) {
      return
    }

    spokenReplyIdRef.current = lastReply.id
    speechSynthesis.speak(lastReply.text)
  }, [lastReply, speechSynthesis])

  const voicePhase = useMemo(() => {
    if (!speechRecognition.isSupported) return 'error'
    if (speechRecognition.error || transientPhase === 'error') return 'error'
    if (speechRecognition.isListening) return 'listening'
    if (transientPhase === 'transcribing') return 'transcribing'
    if (isSending) return 'sending'
    if (speechSynthesis.isSpeaking) return 'speaking'
    return 'idle'
  }, [
    isSending,
    speechRecognition.error,
    speechRecognition.isListening,
    speechRecognition.isSupported,
    speechSynthesis.isSpeaking,
    transientPhase,
  ])

  const statusText = (() => {
    if (!speechRecognition.isSupported) return '当前浏览器不支持语音识别，可以直接输入文字。'
    if (speechRecognition.error) return '这次没有听清，我们继续用文字也完全没问题。'
    if (voicePhase === 'transcribing') return '我先把你刚才的话整理成文字。'
    if (voicePhase === 'sending') return '我正在根据你的状态准备回复。'
    if (voicePhase === 'listening') return '我在听，你慢慢说。'
    if (voicePhase === 'speaking') return '我正在把这段回复读给你听。'
    return '点一下麦克风，我们就可以开始这段陪伴对话。'
  })()

  const subText = speechRecognition.transcript
    ? speechRecognition.transcript
    : lastReply?.text || '点一下麦克风，开始这一轮语音陪伴。'

  return (
    <section className="voice-call-panel call-stage-panel" aria-label="陪伴通话面板">
      <div className="call-stage-top">
        <p className="eyebrow">陪伴通话</p>
        <span className={`call-state-chip is-${voicePhase}`}>{statusText}</span>
      </div>

      <div className="call-stage-center">
        <div className={`voice-orb voice-wave call-voice-orb is-${voicePhase}`} aria-hidden="true">
          <span>{persona?.avatar || '旅'}</span>
        </div>
        <div className="call-stage-copy">
          <h2>{persona?.name || 'SoloMate'}</h2>
          <p>{subText}</p>
        </div>
      </div>

      <div className="voice-call-controls">
        <button
          type="button"
          className={`round-control ${speechRecognition.isListening ? 'is-active' : ''}`}
          onClick={speechRecognition.isListening ? speechRecognition.stopListening : speechRecognition.startListening}
          disabled={!speechRecognition.isSupported || isSending}
          aria-label={speechRecognition.isListening ? '停止识别' : '开始识别'}
          title={speechRecognition.isListening ? '停止识别' : '开始识别'}
        >
          {speechRecognition.isListening ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        <button
          type="button"
          className={`round-control ${speechSynthesis.isSpeaking ? 'is-active' : ''}`}
          onClick={speechSynthesis.isSpeaking ? speechSynthesis.cancel : () => speechSynthesis.speak(lastReply?.text)}
          disabled={!speechSynthesis.isSupported || !lastReply?.text}
          aria-label={speechSynthesis.isSpeaking ? '停止播报' : '播放回复'}
          title={speechSynthesis.isSpeaking ? '停止播报' : '播放回复'}
        >
          {speechSynthesis.isSpeaking ? <VolumeX size={22} /> : <Volume2 size={22} />}
        </button>
      </div>

      <VoiceSettings settings={speechSynthesis.settings} voices={speechSynthesis.voices} onChange={speechSynthesis.updateSettings} />
    </section>
  )
}

export default VoiceCallPanel
